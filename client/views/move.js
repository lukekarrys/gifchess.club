var Board = require('ampersand-chess-view');
var templates = require('../templates');


module.exports = Board.extend({
    template: templates.views.move,
    props: {
        current: ['boolean', true, true]
    },
    bindings: {
        current: {type: 'toggle'},
        'model.gif': {
            type: 'attribute',
            name: 'src',
            hook: 'gif'
        },
        loading: {
            type: 'booleanClass'
        },
        'model.san': {
            hook: 'san'
        }
    },
    derived: {
        loading: {
            deps: ['model.gif'],
            fn: function () {
                return !this.model.gif;
            }
        }
    }
});
