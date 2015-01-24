var Board = require('ampersand-chess-view');
var templates = require('../templates');

module.exports = Board.extend({
    template: templates.views.board
});
