/* globals ga */

module.exports = {
    pageview: function (l) {
        ga('send', 'pageview', l.pathname + l.search);
    }
};