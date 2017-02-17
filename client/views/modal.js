var BaseView = require('./base')
var bind = require('underscore').bind

module.exports = BaseView.extend({
  props: {
    modalConfig: 'object',
    parent: 'state'
  },
  render: function () {
    this.renderWithTemplate()

    this.modal = this.$el.modal(this.modalConfig || {})
    this.modal.on('hidden.bs.modal', bind(this.onModalHidden, this))
    this.modal.modal('show')

    return this
  },
  hideModal: function () {
    this.modal.modal('hide')
  },
  forceHideModal: function () {
    this.$el.removeClass('fade')
    this.hideModal()
  },
  remove: function () {
    this.forceHideModal()
    BaseView.prototype.remove.apply(this, arguments)
    this.parent && this.parent.removeSubview(this)
  },
  onModalHidden: function () {
    this.modal.remove()
    this.remove()
  }
})
