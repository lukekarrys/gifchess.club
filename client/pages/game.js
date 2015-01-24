var BaseView = require('../views/base');
var templates = require('../templates');


module.exports = BaseView.extend({
    template: templates.pages.game,

    bindings: {
        whitePlayer: {hook: 'white-player'},
        blackPlayer: {hook: 'black-player'},
    },

    props: {
        whitePlayer: {
            deps: ['model.white.username'],
            fn: function () {
                return this.model.white.name || 'Waiting for player to join...';
            }
        },
        blackPlayer: {
            deps: ['model.black.username'],
            fn: function () {
                return this.model.black.name || 'Waiting for player to join...';
            }
        }
    },

    initialize: function () {
        this.listenTo(this.model, 'change:id', function () {
            app.navigate('/game/' + this.model.id, {trigger: false, replace: true});
        });
    }
});
