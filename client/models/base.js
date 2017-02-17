var _ = require('underscore')
var State = require('ampersand-state')

module.exports = State.extend({
  pick: function () {
    return _.pick.apply(_, [this].concat(_.toArray(arguments)))
  }
})
