var BaseState = require('./base');
var Chess = require('ampersand-chess-state');
var Moves = require('ampersand-collection').extend({
    model: BaseState.extend({
        props: {
            id: 'string',
            gif: 'string',
            pgn: 'string',
            move: 'object'
        }
    })
});
var User = require('./user').extend({
    collections: {
        moves: Moves
    }
});



module.exports = BaseState.extend({
    children: {
        white: User,
        black: User,
        chess: Chess
    },
    session: {
        id: 'string',
        error: 'string',
        playingState: {
            type: 'string',
            default: 'none',
            values: ['none', 'watcher', 'black', 'white', 'joining']
        }
    },
    derived: {
        newGame: {
            deps: ['id'],
            fn: function () {
                return this.id === 'new';
            }
        },
        role: {
            deps: ['playingState'],
            fn: function () {
                return ['black', 'white', 'watcher'].indexOf(this.playingState) > -1 ? this.playingState : 'watcher';
            }
        }
    },

    initialize: function () {
        this.initNew = this.newGame;
        this.chess.freezeOnFinish = true;

        if (app.me.authed) {
            if (this.newGame) {
                this._findOpenGames();
            } else {
                this._findOpenColors();
            }
        } else {
            if (this.newGame) {
                this.error = 'AUTH';
            } else {
                this._startGame({
                    role: 'watcher'
                });
            }
        }
    },
    _getGameRef: function () {
        return this.gameRef || (this.gameRef = app.firebase.child('games/' + this.id));
    },
    _findOpenGames: function () {
        var openRef = app.firebase.child('open_games');

        openRef.once('value', function (openGames) {
            var numGames = openGames.numChildren();
            var id;

            if (numGames === 0) {
                id = openRef.push({
                    open: true
                }).key();
            } else {
                var val = openGames.val();
                id = Object.keys(val)[0];
                openRef.child(id).remove();
            }

            this.id = id;
            this._findOpenColors();
        }.bind(this));
    },
    _findOpenColors: function () {
        this._getGameRef().once('value', function (gameSS) {
            var game = gameSS.val();
            if (game === null && !this.initNew) {
                this.error = 'NOT_EXIST';
            } else {
                this._getGameRef().child('players').once('value', this._attemptJoin.bind(this));
            }
        }, this);
    },
    _attemptJoin: function (data) {
        var players = data.val();
        var canJoin = this.playingState === 'none';
        var hasWhite = !!players && !!players.white && players.white.uid;
        var hasBlack = !!players && !!players.black && players.black.uid;

        // One of the players is us, so we play
        if (hasWhite === app.me.uid) {
            return this._startGame({role: 'white', user: app.me.identity(), init: false});
        }
        else if (hasBlack === app.me.uid) {
            return this._startGame({role: 'black', user: app.me.identity(), init: false});
        }

        // No players so join as white
        if (players === null && canJoin) {
            return this._joinAs('white', app.me);
        }
        // Only white is open
        else if (hasBlack && !hasWhite && canJoin) {
            return this._joinAs('white', app.me);
        }
        // Only black is open
        else if (hasWhite && !hasBlack && canJoin) {
            return this._joinAs('black', app.me);
        }
    },
    _joinAs: function (color, user) {
        this.playingState = 'joining';

        this._getGameRef()
        .child('players/' + color)
        .transaction(function (player) {
            return player === null ? user.identity() : void 0;
        }, function (error, committed, snapshot) {
            if (committed) {
                this._startGame({
                    role: color,
                    user: snapshot.val(),
                    init: true
                });
            }
            else {
                this._findOpenGames();
            }
        }.bind(this));
    },
    _startGame: function (options) {
        this.playingState = options.role;

        if (options.role === 'white' || options.role === 'black') {
            this[options.role].set(options.user);
        }

        this._getGameRef().child('players/white').on('value', function (data) {
            this.white.set(data.val() || {});
        }, this);

        this._getGameRef().child('players/black').on('value', function (data) {
            this.black.set(data.val() || {});
        }, this);

        // this._getGameRef()
        // .child('moves').once('value', this._getInitialMoves, this);

        // var initial = true;

        this._getGameRef()
        .child('moves')
        .on('child_added', this.onAddMove, this);

        this._getGameRef()
        .child('moves')
        .on('child_changed', this.onMoveUpdate, this);

        this.listenTo(this.chess, 'change:move', this.sendMove);
    },
    onAddMove: function (snapshot) {
        var data = snapshot.val();
        data.id = snapshot.key();
        this.chess.set('pgn', data.pgn);
        this.addMove(data);
    },
    onMoveUpdate: function (snapshot) {
        this.addMove(snapshot.val(), {merge: true});
    },
    addMove: function (data, options) {
        if (data.color === 'w') {
            this.white.moves.add(data, options);
        }
        else if (data.color === 'b') {
            this.black.moves.add(data, options);
        }
    },
    sendMove: function (model, move) {
        var self = this;
        if ((this.white.isMe && move.color === 'w') || (this.black.isMe && move.color === 'b')) {
            move.pgn = model.pgn;
            var ref = this._getGameRef().child('moves').push(move);
            var key = ref.key();
            this.createGif(function (data) {
                self._getGameRef().child('moves/' + key).update({gif: data});
            });
        }
    }
});
