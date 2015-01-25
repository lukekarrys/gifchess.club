var BaseView = require('./base');
var Gifshot = require('../libraries/gifshot');
var getUserMedia = require('getusermedia');
var attachMediaStream = require('attachmediastream');


module.exports = BaseView.extend({
    template: '<div><video data-hook="video"/></div>',
    props: {
        stream: 'object',
        streamRequest: 'boolean',
        error: 'object'
    },
    derived: {
        errorMessage: {
            deps: ['error'],
            fn: function () {
                return this.error ? this.error.name : '';
            }
        },
        validStream: {
            deps: ['stream', 'error'],
            fn: function () {
                return !!this.stream && !this.error;
            }
        },
        permissionDenied: {
            deps: ['errorMessage'],
            fn: function () {
                return this.errorMessage === 'PermissionDeniedError';
            }
        }
    },
    _proxyToApp: function (key, model, value) {
        app[key] = value;
    },
    render: function () {
        this.renderWithTemplate();
        this.listenTo(this, 'change:stream', this._proxyToApp.bind(this, 'stream'));
        this.listenTo(this, 'change:streamRequest', this._proxyToApp.bind(this, 'streamRequest'));
        if (this.stream) {
            // Reuse our existing app stream so we dont have to prompt
            // for access on each page load
            this.attachStream();
        } else {
            this.listenTo(this, 'change:stream', this.attachStream);
            this.getUserMedia();
        }
    },
    getUserMedia: function () {
        if (!this.streamRequest) {
            this.streamRequest = true;
            getUserMedia({video: true, audio: false}, this.getStream.bind(this));
        }
    },
    getStream: function (err, stream) {
        this.streamRequest = false;
        if (err) {
            this.error = err;
        } else {
            this.stream = stream;
        }
    },
    attachStream: function () {
        attachMediaStream(this.stream, this.queryByHook('video'), {
            autoplay: true,
            mirror: true,
            muted: true,
            audio: false
        });
    },
    creatGif: function (cb) {
        Gifshot.createGIF({
            gifWidth: 200,
            gifHeight: 200,
            keepCameraOn: true,
            cameraStream: this.stream
        }, function (obj) {
            if (!obj.error) {
                cb && cb(obj.image);
            } else {
                this.error = 'Could not get your camera';
            }
        }.bind(this));
    }
});
