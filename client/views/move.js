var Board = require('ampersand-chess-view');
var templates = require('../templates');


module.exports = Board.extend({
    template: templates.views.move,
    bindings: {
        'model.gif': {
            type: 'attribute',
            name: 'src',
            hook: 'gif'
        },
        'model.san': {
            hook: 'san'
        }
    }
});
