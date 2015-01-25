/* globals jQuery */
var Board = require('ampersand-chess-view');
var templates = require('../templates');


module.exports = Board.extend({
    template: templates.views.board,
    events: {
        'click button[data-hook=first]': 'runAction',
        'click button[data-hook=last]': 'runAction',
        'click button[data-hook=undo]': 'runAnimateAction',
        'click button[data-hook=redo]': 'runAnimateAction'
    },
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
    },
    runAction: function (e, options) {
        options || (options = {});
        e.preventDefault && e.preventDefault();

        var target = jQuery(e.target).closest('button')[0];
        var method = target.getAttribute ? target.getAttribute('data-hook') : target.method;
        var disabled = target.hasAttribute ? target.hasAttribute('disabled') : target.disabled;
        var result;

        if (!disabled && typeof this.chess[method] === 'function') {
            result = this.chess[method](options);
        }

        if (options.animating && !result) {
            this._animating = false;
        }

        return result;
    },
    onDragStart: function (source, piece) {
        if (this.chess.finished || this.chess.canRedo) {
            return false;
        }

        var turn = this.chess.turn.charAt(0);
        var pieceColor = piece.charAt(0);
        var isTurn = turn === pieceColor;

        // Analysis boards can always be dragged for the current color
        if (this.role === 'analysis') {
            return isTurn;
        }

        var player = this.color.charAt(0);
        if (!player) {
            // Otherwise dragging is only valid if there is a current color
            return false;
        } else {
            // If there is a player, only allow them to move their pieces on their turn
            return player === pieceColor && isTurn;
        }
    },
});
