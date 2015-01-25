/* globals jQuery */

var _ = require('underscore');
var MainView = require('ampersand-main-view');
var templates = require('../templates');
var track = require('../helpers/analytics');
var router = require('../router');


module.exports = MainView.extend({
    template: templates.app,

    props: {
        me: 'state',
        pageTitle: 'string'
    },

    _domEvents: {
        'click [data-hook=login]': 'login',
        'click [data-hook=logout]': 'logout',
        'click [data-hook=refresh]': 'refresh'
    },
    events: function () {
        return _.extend({}, this._domEvents, MainView.prototype.events);
    },

    bindings: {
        pageTitle: {
            type: function (el, value) {
                document.title = value || this.model.name;
            }
        },
        'me.authed': {type: 'toggle', no: '[data-hook=login-nav]', yes: '[data-hook=user-nav]'},
        'me.username': {hook: 'username'},
        'me.profileUrl': {type: 'attribute', name: 'href', hook: 'user-link'}
    },

    pageRegion: '[data-hook=page-container]',
    navRegion: '[data-hook=main-nav]',
    router: router,

    $: function (selector) {
        return jQuery(selector, this.el);
    },

    login: function (e) {
        e.preventDefault();
        app.login();
    },
    logout: function (e) {
        e.preventDefault();
        app.logout();
    },
    refresh: function (e) {
        e.preventDefault();
        location.reload(true);
    },

    updatePage: function () {
        if (this.currentPage) {
            this.stopListening(this.currentPage);
        }
        MainView.prototype.updatePage.apply(this, arguments);
        if (app.isLocal) {
            window.page = this.currentPage;
            window.model = this.currentPage.model;
        }
        this.listenTo(this.currentPage, 'change:pageTitle', function () {
            this.pageTitle = this.currentPage.pageTitle;
        });
        this.pageTitle = this.currentPage.pageTitle;
        this.collapseNav();
        if (!app.isLocal) {
            track.pageview(window.location.pathname);
        }
    },

    collapseNav: function () {
        var $el = this.$mainCollapseNav || (this.$mainCollapseNav = this.$('[data-hook=main-nav-collapse]'));
        if ($el.hasClass('in')) {
            $el.collapse('hide');
        }
        $el.find('.dropdown.open .dropdown-toggle').dropdown('toggle');
    }
});
