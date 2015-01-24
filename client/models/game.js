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
            values: ['none', 'watching', 'black', 'white', 'joining']
        }
    },
    derived: {
        newGame: {
            deps: ['id'],
            fn: function () {
                return this.id === 'new';
            }
        }
    },

    initialize: function () {
        this.initNew = this.newGame;

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
                    role: 'watching'
                });
            }
        }
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
        this.gameRef = app.firebase.child('games/' + this.id);
        this.gameRef.once('value', function (gameSS) {
            var game = gameSS.val();
            if (game === null && !this.initNew) {
                this.error = 'NOT_EXIST';
            } else {
                this.gameRef.child('players').once('value', this._attemptJoin.bind(this));
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

        this.gameRef
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

        this.gameRef.child('players').on('value', function (data) {
            data = data.val();
            console.log('PLAYERS', JSON.stringify(data, null, 2));

            if (data) {
                if (data.white) {
                    this.white.set(data.white);
                }
                if (data.black) {
                    this.black.set(data.black);
                }
            }
        }, this);

        this.gameRef.child('moves').on('value', function (data) {
            data = data.val();
            console.log('MOVES', JSON.stringify(data, null, 2));
        }, this);
    }
});
