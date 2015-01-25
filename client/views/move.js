var Board = require('ampersand-chess-view');
var templates = require('../templates');


module.exports = Board.extend({
    template: templates.views.move,
    bindings: {
        hide: {type: 'toggle'},
        'model.active': {type: 'booleanClass'},
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
        },
        hide: {
            deps: ['model.active'],
            fn: function () {
                return this.model.active;
            }
        }
    }
});
