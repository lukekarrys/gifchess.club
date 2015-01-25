var _ = require('underscore');
var BaseState = require('./base');
var AmpChess = require('ampersand-chess-state');
var Chess = AmpChess.extend({
    undo: function (options) {
        var result = AmpChess.prototype.undo.call(this, options);
        if (result) {
            this.trigger('change:undo', this, result, options);
        }
        return result;
    },
    redo: function (options) {
        var result = AmpChess.prototype.redo.call(this, options);
        if (result) {
            this.trigger('change:redo', this, result, options);
        }
        return result;
    }
});
var Moves = require('ampersand-collection').extend({
    activate: function (san) {
        this.forEach(function (model) {
            model.active = model.san === san;
        });
    },
    model: BaseState.extend({
        props: {
            id: 'string',
            gif: 'string',
            pgn: 'string',
            san: 'string',
            color: 'string',
            from: 'string',
            to: 'string',
            piece: 'string',
            flags: 'string'
        },
        session: {
            active: ['boolean', true, true]
        }
    }),
    comparator: function (a, b) {
        return a.pgn.length - b.pgn.length;
    }
});
var User = require('./user').extend({
    collections: {moves: Moves}
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
        loadingInitial: ['boolean', true, true],
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
        },
        loading: {
            deps: ['playingState', 'loadingInitial'],
            fn: function () {
                return this.playingState === 'none' || this.playingState === 'joining' || this.loadingInitial;
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
        openRef.limitToFirst(1).once('value', function (openGames) {
            var numGames = openGames.numChildren();
            var id;

            if (numGames === 0) {
                id = openRef.push({open: true}).key();
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
        this._getGameRef().child('players').once('value', this._attemptJoin.bind(this));
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
            return player === null ? _.extend(user.identity(), {color: color}) : void 0;
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

        // Get the last move for each player
        this._getGameRef()
        .child('moves')
        .limitToLast(2)
        .once('value', this.getInitialState, this);
    },
    getInitialState: function (snapshot) {
        this.loadingInitial = false;
        snapshot.forEach(function (moveSS) {
            var key = moveSS.key();
            this._getGameRef().child('gifs/' + key).once('value', this.updateGifMove, this);
            this.updatePgnMove(moveSS);
        }.bind(this));

        this._getGameRef()
        .child('moves')
        .on('child_added', this.updatePgnMove, this);

        this._getGameRef()
        .child('moves')
        .on('child_changed', this.addMergeMove, this);

        this._getGameRef()
        .child('gifs')
        .on('child_added', this.updateGifMove, this);

        this.listenTo(this.chess, 'change:move', this.sendMove);
        this.listenTo(this.chess, 'change:undo', this.onUndo);
        this.listenTo(this.chess, 'change:redo', this.onRedo);
    },
    onUndo: function (model) {
        var move;
        if (model.turn === 'black') {
            move = model.history[model.history.length - 2];
            if (move) {
                this.black.moves.activate(move);
            }
        } else if (model.turn === 'white') {
            move = model.history[model.history.length - 2];
            if (move) {
                this.white.moves.activate(move);
            }
        }
    },
    onRedo: function (model) {
        var move;
        if (model.turn === 'white') {
            move = model.history[model.history.length - 1];
            if (move) {
                this.black.moves.activate(move);
            }
        } else if (model.turn === 'black') {
            move = model.history[model.history.length - 1];
            if (move) {
                this.white.moves.activate(move);
            }
        }
    },
    updatePgnMove: function (snapshot) {
        var data = snapshot.val();
        this.addMergeMove(snapshot);
        // Only update internal engine if we are increasing the pgn
        if (data.pgn && data.pgn.length > this.chess.pgn.length) {
            this.chess.set('pgn', data.pgn, {firebase: true});
        }
    },
    updateGifMove: function (snapshot) {
        var id = snapshot.key();
        var gif = snapshot.val();
        this.addMergeMove({id: id, gif: gif});
    },
    addMergeMove: function (snapshot) {
        var data, id;

        if (snapshot.val && snapshot.key) {
            id = snapshot.key();
            data = snapshot.val();
            data.id = id;
        } else {
            data = snapshot;
        }

        var collection;
        if (data.color) {
            collection = this[data.color].moves;
        }
        else if (this.white.moves.get(data.id)) {
            collection = this.white.moves;
        }
        else if (this.black.moves.get(data.id)) {
            collection = this.black.moves;
        }
        if (collection) {
            collection.add(data, {merge: true});
        }
    },
    sendMove: function (model, move, options) {
        var self = this;
        var isWhite = this.white.isMe && move.color === 'w';
        var isBlack = this.black.isMe && move.color === 'b';
        var isFirebase = options && options.firebase;

        if ((isWhite || isBlack) && !isFirebase) {
            move.pgn = model.pgn;
            move.color = move.color === 'w' ? 'white' : 'black';
            var ref = this._getGameRef().child('moves').push(move);
            var key = ref.key();
            this.createGif(function (data) {
                self._getGameRef().child('gifs/' + key).set(data);
            });
        }
    },
    createGif: function () {
        // This gets overriden in the parent view
        // but leave this here so no errors happen
    }
});
