var _ = require('underscore');
var BaseView = require('./base');
var templates = require('../templates');
var Board = require('../views/board');
var GifCamera = require('../views/gifCamera');
var CameraAccess = require('../views/cameraAccess');
var Move = require('../views/move');
var template = templates.pages.game;
var playerDeps = ['model.white.username', 'model.black.username', 'defaultPlayer'];


module.exports = BaseView.extend({
    template: template,

    bindings: {
        'activeTop': {type: 'booleanClass', name: 'active', hook: 'top-player'},
        'activeBottom': {type: 'booleanClass', name: 'active', hook: 'bottom-player'},
        topPlayerName: {selector: '[data-hook=top-player] [data-hook=name]'},
        bottomPlayerName: {selector: '[data-hook=bottom-player] [data-hook=name]'},
        'model.loading': [
            {type: 'booleanClass', hook: 'chess-game'},
            {type: 'booleanClass', hook: 'board-col'}
        ],
        hideDuringLoading: [
            {type: 'toggle', hook: 'player-col'},
            {type: 'toggle', hook: 'status'}
        ],
        errorMessage: [
            {type: 'toggle', yes: '[data-hook=error]', no: '[data-hook=content]'},
            {hook: 'error', type: 'innerHTML'}
        ]
    },
    props: {
        defaultPlayer: ['string', true, 'Waiting for player...']
    },
    derived: {
        hideDuringLoading: {
            deps: ['model.loading'],
            fn: function () {
                return !this.model.loading;
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
        bottomPlayer: {
            deps: ['model.role'],
            fn: function () {
                if (this.model.role === 'white' || this.model.role === 'watcher') {
                    return 'white';
                } else {
                    return 'black';
                }
            }
        },
        bottomPlayerName: {
            deps: ['bottomPlayer'].concat(playerDeps),
            fn: function () {
                return this.model[this.bottomPlayer].username || this.defaultPlayer;
            }
        },
        topPlayer: {
            deps: ['bottomPlayer'],
            fn: function () {
                return (this.bottomPlayer === 'white') ? 'black' : 'white';
            }
        },
        topPlayerName: {
            deps: ['topPlayer'].concat(playerDeps),
            fn: function () {
                return this.model[this.topPlayer].username || this.defaultPlayer;
            }
        },
        activePlayer: {
            deps: ['topPlayer', 'bottomPlayer', 'model.chess.turn'],
            fn: function () {
                return this.model.chess.turn === this.topPlayer ? 'top' : 'bottom';
            }
        },
        activeTop: {
            deps: ['activePlayer'],
            fn: function () {
                return this.activePlayer === 'top';
            }
        },
        activeBottom: {
            deps: ['activePlayer'],
            fn: function () {
                return this.activePlayer === 'bottom';
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
        this.listenToOnce(this.model, 'change:role', this.checkRole);
        this.listenToOnce(app, 'change:streamSuccess', this.checkStream);
        return this;
    },
    checkRole: function () {
        if (this.model.role === 'watcher') {
            this.renderGifCollections();
        }
        else {
            this.renderCameraAccess();
            app.getUserMedia();
        }
    },

    // ------------------------
    // BOARD
    // ------------------------
    renderBoard: function () {
        this.boardView = this.renderSubview(new Board({
            chess: this.model.chess,
            role: this.model.role,
            Chessboard: window.ChessBoard,
            boardConfig: {
                pieceTheme: '/img/{piece}.png',
                showNotation: false
            }
        }), this.queryByHook('chess-game'));

        this.listenTo(this.model, 'change:role', this.setBoardRole);
        this._applyBindingsForKey('hideDuringLoading');

        this.bindWindowEvents({resize: 'onResize'});
        _.defer(_.bind(this.onResize, this));
    },
    setBoardRole: function () {
        this.boardView.role = this.model.role;
    },
    onResize: function () {
        this.boardView.board.resize();
    },


    // ------------------------
    // CAMERA / GIF
    // ------------------------
    renderGifCollections: function () {
        var white, black;

        if (this.topPlayer === 'white') {
            white = this.query('[data-hook=top-player] [data-hook=moves]');
            black = this.query('[data-hook=bottom-player] [data-hook=moves]');
        }
        else {
            white = this.query('[data-hook=bottom-player] [data-hook=moves]');
            black = this.query('[data-hook=top-player] [data-hook=moves]');
        }

        this.renderCollection(this.model.white.moves, Move, white);
        this.renderCollection(this.model.black.moves, Move, black);
    },
    renderCameraAccess: function () {
        this.cameraAccessView = this.registerSubview(
            new CameraAccess({
                stream: app
            }).render()
        );
    },
    checkStream: function () {
        if (app.streamSuccess) {
            this.renderGifCamera();
            this.renderGifCollections();
        }
    },
    renderGifCamera: function () {
        var self = this;
        this.gifView = this.renderSubview(
            new GifCamera({stream: app.stream}),
            this.queryByHook('gif-camera')
        );
        this.model.createGif = self.gifView.createGif.bind(self.gifView);
    }
});
