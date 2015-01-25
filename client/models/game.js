var BaseState = require('./base');
var User = require('./user');
var Chess = require('ampersand-chess-state');


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

        var initial = true;
        this._getGameRef()
        .child('moves')
        .endAt()
        .limitToLast(1)
        .on('child_added', function (snapshot) {
            // Dont animate the initial state
            this.onMove(snapshot, {animate: !initial});
            initial = false;
        }, this);

        this.listenTo(this.chess, 'change:move', this.sendMove);
    },
    onMove: function (data, options) {
        this.chess.set('pgn', data.val().pgn, options);
    },
    sendMove: function (model, move) {
        move.pgn = model.pgn;
        this._getGameRef().child('moves').push(move);
    }
});
