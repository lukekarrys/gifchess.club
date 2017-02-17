// PAGES
var HomePage = require('./pages/home')
var RecentGames = require('./pages/recentGames')
var GamePage = require('./pages/game')
var _404Page = require('./pages/_404')

// MODELS
var Game = require('./models/game')

module.exports = {
  routes: {
    '': 'home',
    'games/new': 'newGame',
    'games/recent': 'recentGames',
    'games/:id': 'game',
    '*path': '_404'
  },

  home: function () {
    this.triggerPage(new HomePage())
  },

  game: function (id) {
    this.triggerPage(new GamePage({
      model: new Game({
        id: id
      })
    }))
  },

  newGame: function () {
    this.triggerPage(new GamePage({
      model: new Game({
        id: 'new'
      })
    }))
  },

  recentGames: function () {
    this.triggerPage(new RecentGames())
  },

  _404: function () {
    this.triggerPage(new _404Page())
  }
}
