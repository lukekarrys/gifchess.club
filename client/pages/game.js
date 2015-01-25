var _ = require('underscore');
var BaseView = require('./base');
var templates = require('../templates');
var Board = require('../views/board');
var GifCamera = require('../views/gifCamera');
var CameraAccess = require('../views/cameraAccess');
var template = templates.pages.game;
var playerDeps = ['model.white.username', 'model.black.username', 'model.white.isMe', 'model.black.isMe', 'defaultPlayer'];


module.exports = BaseView.extend({
    template: template,

    bindings: {
        topPlayer: {selector: '[data-hook=top-player] [data-hook=name]'},
        bottomPlayer: {selector: '[data-hook=bottom-player] [data-hook=name]'},
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
            deps: playerDeps,
            fn: function () {
                if (this.model.white.isMe) {
                    return this.model.black.username || this.defaultPlayer;
                }
                return this.model.white.username || this.defaultPlayer;
            }
        },
        bottomPlayer: {
            deps: playerDeps,
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
    },


    // ------------------------
    // CAMERA / GIF
    // ------------------------
    renderGifCollections: function () {

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
