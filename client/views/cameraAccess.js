var Modal = require('./modal');
var templates = require('../templates');


module.exports = Modal.extend({
    template: templates.modals.cameraAccess,
    props: {
        stream: 'state',
        modalConfig: {
            type: 'object',
            default: function () {
                return {
                    backdrop: 'static'
                };
            }
        }
    },
    derived: {
        message: {
            deps: ['stream.permissionDenied'],
            fn: function () {
                return this.stream.permissionDenied ?
                    this.template.denied() :
                    this.template.prompt();
            }
        }
    },
    bindings: {
        message: {hook: 'message', type: 'innerHTML'}
    }
});
