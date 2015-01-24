var BaseState = require('./base');



module.exports = BaseState.extend({
    props: {
        id: 'string',

        uid: 'string',
        token: 'string',
        provider: 'string',
        displayName: 'string',
        username: 'string',
        avatar: 'string',

        _auth: 'object'
    },
    derived: {
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
            deps: ['userId'],
            fn: function () {
                return '/user/' + this.userId;
            }
        }
    },
    auth: function (data) {
        this._auth = data;

        if (!data) {
            this.clear();
        }
        else if (data.provider === 'twitter') {
            this.set({
                uid: data.uid,
                token: data.uid,
                provider: data.provider,
                displayName: data.twitter.displayName,
                username: data.twitter.username,
                avatar: data.twitter.cachedUserProfile.profile_image_url
            });
        }
    }
});
