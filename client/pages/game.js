var BaseView = require('../views/base');
var templates = require('../templates');


module.exports = BaseView.extend({
    template: templates.pages.game,

    bindings: {
        whitePlayer: {hook: 'white-player'},
        blackPlayer: {hook: 'black-player'},
        loadingMessage: [
            {type: 'toggle', yes: '[data-hook=loading]', no: '[data-hook=content]'},
            {hook: 'loading', type: 'innerHTML'}
        ],
        errorMessage: [
            {type: 'toggle', hook: 'error'},
            {hook: 'error', type: 'innerHTML'}
        ]
    },
    derived: {
        loadingMessage: {
            deps: ['model.playingState'],
            fn: function () {
                if (this.model.playingState === 'none') {
                    return 'Loading game state...';
                }
                return '';
            }
        },
        errorMessage: {
            deps: ['model.error'],
            fn: function () {
                if (this.model.error === 'NOT_EXIST') {
                    return 'This game does not exist. Find a <a href="/games/new">new one?</a>';
                }
                else if (this.model.error === 'AUTH') {
                    return 'You must be logged in to start a new game. Try <a href="#" data-hook="login">logging in with Twitter.</a>';
                }
                return '';
            }
        },
        whitePlayer: {
            deps: ['model.white.username'],
            fn: function () {
                return this.model.white.username || 'Waiting for player to join...';
            }
        },
        blackPlayer: {
            deps: ['model.black.username'],
            fn: function () {
                return this.model.black.username || 'Waiting for player to join...';
            }
        }
    },
    initialize: function () {
        this.listenTo(this.model, 'change:id', function () {
            app.navigate('/games/' + this.model.id, {trigger: false, replace: true});
        });
    }
});
