var _ = require('underscore');
var View = require('ampersand-view');
var jQueryView = require('../helpers/jquery-ampersand-view');


module.exports = jQueryView(View).extend({
    bindWindowEvents: function (events) {
        var ns = '.cid-' + this.cid;
        _.each(events || {}, function (method, event) {
            if (event === 'resize') {
                this.$(window).on('orientationchange' + ns, _.bind(this[method], this));
            }
            this.$(window).on(event + ns, _.bind(this[method], this));
        }, this);
    },
    remove: function () {
        var ns = '.cid-' + this.cid;
        this.$(window).off(ns);
        return View.prototype.remove.apply(this, arguments);
    },
    removeSubview: function (subview) {
        var index = this._subviews.indexOf(subview);
        index > -1 && this._subviews.splice(index, 1);
    }
});
