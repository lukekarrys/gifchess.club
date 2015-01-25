var _ = require('underscore');
var BaseView = require('./base');
var templates = require('../templates');
var Board = require('../views/board');
var template = templates.pages.game;


module.exports = BaseView.extend({
    template: template,

    bindings: {
        topPlayer: {hook: 'top-player'},
        bottomPlayer: {hook: 'bottom-player'},
        hidePlayers: {type: 'toggle', selector: '[data-hook=top-player], [data-hook=bottom-player]'},
        loading: {type: 'booleanClass', hook: 'chess-game'},
        errorMessage: [
            {type: 'toggle', yes: '[data-hook=error]', no: '[data-hook=content]'},
            {hook: 'error', type: 'innerHTML'}
        ]
    },
    props: {
        defaultPlayer: ['string', true, 'Waiting for player...']
    },
    derived: {
        hidePlayers: {
            deps: ['loading'],
            fn: function () {
                return !this.loading;
            }
        },
        loading: {
            deps: ['model.playingState'],
            fn: function () {
                return this.model.playingState === 'none';
            }
        },
        errorMessage: {
            deps: ['model.error'],
            fn: function () {
                if (this.model.error === 'NOT_EXIST') {
                    return template.error();
                }
                else if (this.model.error === 'AUTH') {
                    return template.auth();
                }
                return '';
            }
        },
        topPlayer: {
            deps: ['model.white.username', 'model.black.username', 'model.white.isMe', 'model.black.isMe', 'defaultPlayer'],
            fn: function () {
                if (this.model.white.isMe) {
                    return this.model.black.username || this.defaultPlayer;
                }
                return this.model.white.username || this.defaultPlayer;
            }
        },
        bottomPlayer: {
            deps: ['model.white.username', 'model.black.username', 'model.white.isMe', 'model.black.isMe', 'defaultPlayer'],
            fn: function () {
                if (this.model.white.isMe) {
                    return this.model.white.username || this.defaultPlayer;
                }
                return this.model.black.username || this.defaultPlayer;
            }
        }
    },
    initialize: function () {
        this.listenTo(this.model, 'change:id', function () {
            app.navigate('/games/' + this.model.id, {trigger: false, replace: true});
        });
    },
    render: function () {
        this.renderWithTemplate();
        this.renderBoard();
        return this;
    },
    renderBoard: function () {
        this.boardView = this.renderSubview(new Board({
            role: this.model.role,
            Chessboard: window.ChessBoard,
            boardConfig: {
                pieceTheme: '/img/{piece}.png',
                showNotation: false
            },
            chess: this.model.chess
        }), this.queryByHook('chess-game'));

        this.bindWindowEvents({resize: 'onResize'});
        _.defer(_.bind(this.onResize, this));

        this.listenTo(this.model, 'change:role', this.setBoardRole);
    },
    setBoardRole: function () {
        this.boardView.role = this.model.role;
    },
    onResize: function () {
        this.boardView.board.resize();
    }
});
