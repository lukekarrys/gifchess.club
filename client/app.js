/* globals jQuery */

var getUserMedia = require('getusermedia')
var attachFastClick = require('fastclick')
var State = require('ampersand-state')
var Firebase = require('firebase')
var log = require('./helpers/log')

var MainView = require('./views/main')
var User = require('./models/user')

var App = State.extend({
  props: {
    firebaseId: ['string', true, 'torid-inferno-617'],
    env: ['string', true, window.location.host.split('.')[0].split(':')[0]],
    name: ['string', true, 'GifChess'],
    id: ['string', true, 'gifchess'],
    rendered: ['boolean', true, false],
    stream: 'object',
    streamRequest: 'boolean',
    streamError: 'object'
  },

  derived: {
    isLocal: {
      deps: ['env'],
      fn: function () {
        return this.env === 'localhost'
      }
    },
    lsKey: {
      deps: ['id', 'env'],
      fn: function () {
        return [this.id, this.env].join('.')
      }
    },
    firebaseUrl: {
      deps: ['firebaseId'],
      fn: function () {
        return 'https://' + this.firebaseId + '.firebaseio.com/'
      }
    },
    firebase: {
      deps: ['firebaseUrl'],
      fn: function () {
        return new Firebase(this.firebaseUrl)
      }
    },
    streamDenied: {
      deps: ['streamError'],
      fn: function () {
        return this.streamError && this.streamError.name === 'PermissionDeniedError'
      }
    },
    streamSuccess: {
      deps: ['stream', 'streamError'],
      fn: function () {
        return !!this.stream && !this.streamError
      }
    }
  },

  initialize: function () {
    window.app = this

    this.me = new User()
    this.firebase.onAuth(this._onAuth.bind(this))
  },
  renderMainView: function () {
    if (this.rendered) return
    this.rendered = true

    jQuery(function () {
      attachFastClick(document.body)

      this.view = new MainView({
        el: document.body,
        model: this,
        me: this.me
      })

      this.navigate = this.view.navigate.bind(this.view)
    }.bind(this))
  },

  // ------------------------
  // STREAM
  // ------------------------
  getUserMedia: function () {
    if (!this.streamRequest) {
      this.streamRequest = true
      getUserMedia({video: true, audio: false}, this.getStream.bind(this))
    }
  },
  getStream: function (err, stream) {
    this.streamRequest = false
    if (err) {
      this.streamError = err
    } else {
      this.stream = stream
    }
  },

  // ------------------------
  // AUTH
  // ------------------------
  login: function () {
    this.firebase.authWithOAuthPopup('twitter', this._tryAuth.bind(this))
  },
  logout: function () {
    this.firebase.unauth()
  },
  _tryAuth: function (err) {
    if (err && err.code === 'TRANSPORT_UNAVAILABLE') {
      this.authWithOAuthRedirect('twitter', this._tryAuth.bind(this))
    } else if (err) {
      log.error(err.code, err.message)
    }
  },
  _onAuth: function (auth) {
    this.me.auth(auth)
    this.renderMainView()
  },

  // ------------------------
  // LOCALSTORAGE
  // ------------------------
  localStorage: function (key, val) {
    var localStorageKey = this.lsKey
    var current = window.localStorage[localStorageKey] || '{}'

    try {
      current = JSON.parse(current)
    } catch (e) {
      current = {}
    }

    if (key && typeof val !== 'undefined') {
      current[key] = val
      window.localStorage[localStorageKey] = JSON.stringify(current)
      return val
    } else if (key) {
      return current[key]
    }
  },
  __reset: function () {
    window.localStorage[this.lsKey] = '{}'
  }
})

// eslint-disable-next-line no-new
new App({})
