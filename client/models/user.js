var BaseState = require('./base');


module.exports = BaseState.extend({
    props: {
        id: 'string',
        uid: 'string',
        token: 'string',
        provider: 'string',
        displayName: 'string',
        username: 'string',
        avatar: 'string'
    },
    session: {
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

    initialize: function () {
        this.listenTo(this, 'change:userId', function () {
            this.id = this.userId;
        });
        // app.firebase.child('users/' + this.id)
        // .on('value', function(snapshot) {
        //     console.log(snapshot.val());
        // }, function (errorObject) {
        //     console.log('The read failed: ' + errorObject.code);
        // });
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
            }
        }
    }
});
