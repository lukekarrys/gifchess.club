/* globals jQuery, Firebase */

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
        firebaseId: ['string', true, 'torid-inferno-617'],
        env: ['string', true, window.location.host.split('.')[0].split(':')[0]],
        name: ['string', true, 'GifChess'],
        id: ['string', true, 'ss15-luke-js']
    },

    derived: {
        lsKey: {
            deps: ['id', 'env'],
            fn: function () {
                return [this.id, this.env].join('.');
            }
        },
        firebaseUrl: {
            deps: ['firebaseId'],
            fn: function () {
                return 'https://' + this.firebaseId + '.firebaseio.com'.replace();
            }
        }
    },

    initialize: function () {
        this.firebase = new Firebase(this.firebaseUrl);
        this.me.auth(this.firebase.getAuth());

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

    login: function () {
        this.firebase.authWithOAuthPopup('twitter', this._onAuth.bind(this));
    },
    _onAuth: function (err, auth) {
        if (err && err.code === 'TRANSPORT_UNAVAILABLE') {
            this.authWithOAuthRedirect('twitter', this._onAuth.bind(this));
        }
        else if (err) {
            console.error(err.code, err.message);
        }
        else if (auth) {
            this.me.auth(auth);
        }
    },
    logout: function () {
        this.firebase.unauth();
        this.me.clear();
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
