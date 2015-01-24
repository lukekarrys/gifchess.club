// PAGES
var HomePage = require('./pages/home');
var GamePage = require('./pages/game');
var UserPage = require('./pages/user');
var _404Page = require('./pages/_404');

// MODELS
var Game = require('./models/game');
var User = require('./models/user');


module.exports = {
    routes: {
        '': 'home',
        'games/new': 'newGame',
        'games/:id': 'game',
        'user/:id': 'user',
        '*path': '_404'
    },

    home: function () {
        this.triggerPage(new HomePage());
    },

    game: function (id) {
        this.triggerPage(new GamePage({
            model: new Game({
                id: id
            })
        }));
    },

    newGame: function () {
        this.triggerPage(new GamePage({
            model: new Game({
                id: 'new'
            })
        }));
    },

    user: function (id) {
        this.triggerPage(new UserPage({
            model: new User({
                id: id
            })
        }));
    },

    _404: function () {
        this.triggerPage(new _404Page());
    }
};
