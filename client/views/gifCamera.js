var BaseView = require('./base');
var Gifshot = require('../libraries/gifshot');
var attachMediaStream = require('attachmediastream');


module.exports = BaseView.extend({
    template: '<div><video data-hook="video"/></div>',
    props: {
        stream: 'any'
    },
    render: function () {
        this.renderWithTemplate();
        // Should always be called with a valid stream
        this.attachStream();
    },
    attachStream: function () {
        attachMediaStream(this.stream, this.queryByHook('video'), {
            autoplay: true,
            mirror: true,
            muted: true,
            audio: false
        });
    },
    createGif: function (cb) {
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
