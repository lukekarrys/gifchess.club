var BaseState = require('./base');
var _ = require('underscore');


module.exports = BaseState.extend({
    props: {
        uid: 'string',
        token: 'string',
        provider: 'string',
        displayName: 'string',
        username: 'string',
        avatar: 'string'
    },
    session: {
         _auth: 'object',
         currentUser: 'string'
     },
    derived: {
        isMe: {
            deps: ['currentUser', 'uid'],
            fn: function () {
                var cur = this.currentUser;
                return !!cur && !!this.uid && cur === this.uid;
            }
        },
        authed: {
            deps: ['uid'],
            fn: function () {
                return !!this.uid;
            }
        },
        userId: {
            deps: ['provider', 'uid'],
            fn: function () {
                return this.uid ? this.uid.replace((this.provider || '') + ':', '') : null;
            }
        },
        profileUrl: {
            deps: ['uid'],
            fn: function () {
                return '/user/' + this.uid;
            }
        }
    },

    initialize: function () {
        if (app.me && this !== app.me) {
            this.listenTo(app.me, 'change:uid', this._setCurrentUser);
            this._setCurrentUser();
        }
    },
    _setCurrentUser: function () {
        this.currentUser = app.me.uid;
    },

    identity: function () {
        return this.pick('uid', 'username');
    },

    fetch: function () {
        app.firebase.child('users').child(this.uid).on('value', function (snapshot) {
            this.set(snapshot.val());
        }, this);
    },

    auth: function (data) {
        if (!data) {
            this.clear();
        }
        else {
            this._auth = data;
            if (data.provider === 'twitter') {
                this.set({
                    uid: data.uid,
                    token: data.token,
                    provider: data.provider,
                    displayName: data.twitter.displayName,
                    username: data.twitter.username,
                    avatar: data.twitter.cachedUserProfile.profile_image_url
                });
                app.firebase.child('users').child(data.uid).set(_.omit(this.toJSON(), 'uid'));
            }
        }
    }
});
