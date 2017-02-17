var Modal = require('./modal')
var templates = require('../templates')

module.exports = Modal.extend({
  template: templates.modals.cameraAccess,
  props: {
    stream: 'state',
    modalConfig: {
      type: 'object',
      default: function () {
        return {
          backdrop: 'static'
        }
      }
    }
  },
  derived: {
    message: {
      deps: ['stream.streamDenied'],
      fn: function () {
        return this.stream.streamDenied
          ? this.template.denied()
          : this.template.prompt()
      }
    }
  },
  bindings: {
    message: {hook: 'message', type: 'innerHTML'}
  },
  render: function () {
    Modal.prototype.render.apply(this, arguments)
    this.listenTo(this.stream, 'change:streamSuccess', function () {
      if (this.stream.streamSuccess) {
        app.localStorage('cameraAccess', true)
        this.hideModal()
      }
    })
    return this
  }
})
