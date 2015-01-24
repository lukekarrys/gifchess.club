// var parse = require('./helpers/parseQuerystring');
var HomePage = require('./pages/home');
var GamePage = require('./pages/game');
var _404Page = require('./pages/_404');

var Game = require('./models/game');


module.exports = {
    routes: {
        '': 'home',
        'game/new': 'newGame',
        'game/:id': 'game',
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

    _404: function () {
        this.triggerPage(new _404Page());
    }
};
