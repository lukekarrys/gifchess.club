var Board = require('ampersand-chess-view');
var templates = require('../templates');


module.exports = Board.extend({
    template: templates.views.board,
    derived: {
        disableUndo: {
            deps: ['chess.canUndo'],
            fn: function () {
                return !this.chess.canUndo;
            }
        },
        disableRedo: {
            deps: ['chess.canRedo'],
            fn: function () {
                return !this.chess.canRedo;
            }
        }
    }
});
