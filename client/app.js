/* globals jQuery */

var _ = require('underscore');
var attachFastClick = require('fastclick');
var State = require('ampersand-state');

var MainView = require('./views/main');
var User = require('./models/user');


var App = State.extend({
    children: {
        me: User
    },

    props: {
        env: ['string', true, window.location.host.split('.')[0]],
        name: ['string', true, 'GifChess'],
        id: ['string', true, 'ss15-luke-js']
    },

    derived: {
        lsKey: {
            deps: ['id', 'env'],
            fn: function () {
                return [this.id, this.env].join('.');
            }
        }
    },

    initialize: function () {
        jQuery(_.bind(function () {
            this.view = new MainView({
                el: document.body,
                model: this,
                me: this.me
            });
            this.navigate = this.view.navigate;
            attachFastClick(document.body);
        }, this));
    },

    logout: function () {
        this.me.clear();
        this.localStorage('username', null);
    },

    localStorage: function (key, val) {
        var localStorageKey = this.lsKey;
        var current = localStorage[localStorageKey] || '{}';

        try {
            current = JSON.parse(current);
        } catch (e) {
            current = {};
        }
        
        if (key && typeof val !== 'undefined') {
            current[key] = val;
            localStorage[localStorageKey] = JSON.stringify(current);
            return val;
        } else if (key) {
            return current[key];
        }
    },

    __reset: function () {
        localStorage[this.lsKey] = '{}';
    }
});


window.app = new App({});
