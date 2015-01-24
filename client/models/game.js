var BaseState = require('./base');
var User = require('./user');


module.exports = BaseState.extend({
    children: {
        white: User,
        black: User
    },
    session: {
        playerLocation: ['string', true, 'player_list'],
        gameLocation: ['string', true, 'player_data'],
        id: 'string',
        errorMessage: 'string'
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
                this._attemptJoin();
            }
        } else {
            if (this.newGame) {
                this.errorMessage = 'You must be logged in to start a new game.';
            } else {
                this._watchGame();
            }
        }
    },
    _findOpenGames: function () {
        var self = this;
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

            self.id = id;
            self._attemptJoin();
        });
    },
    _attemptJoin: function () {
        var self = this;
        this.gameRef = app.firebase.child('games/' + this.id);

        this.gameRef.child(this.playerLocation + '/white/uid').on('value', function (whiteId) {
            if (whiteId.val() === null) {
                self.joinAs('white', app.me);
            }
        });
        this.gameRef.child(this.playerLocation + '/black/uid').on('value', function (blackId) {
            if (blackId.val() === null) {
                self.joinAs('black', app.me);
            }
        });
    },
    joinAs: function (color, user) {
        var self = this;
        var myColor = null;
        var alreadyInGame = false;
        var userId = user.uid;

        this.gameRef.child(this.playerLocation + '/' + color)
        .transaction(function (player) {
            if (player === null) {
                player = user.pick('uid', 'username');
            }

            if (player.uid === userId) {
                alreadyInGame = true;
                myColor = color;
            }

            return player;

        }, function (error, committed, snapshot) {
            snapshot = snapshot.val();

            if (snapshot.white) {
                self.white.set(snapshot.white);
            }

            if (snapshot.black) {
                self.black.set(snapshot.black);
            }

            if (committed || alreadyInGame) {
                self.playGame({
                    color: myColor,
                    id: userId,
                    init: !alreadyInGame
                });
            } else {

            }
        }, false);
    },
    playGame: function (options) {
        console.log('PLAY', options);
        // if (options.color) {
        //     this.playerRef = this.gameRef.child(this.gameLocation).child(options.color);
        //     if (options.init) {
        //         this.playerRef({userId: options.id});
        //     }
        // }
    }
});
