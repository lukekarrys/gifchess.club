/* jshint node:true */

var path = require('path')
var fs = require('fs')
var _ = require('underscore')
var lessitizer = require('lessitizer')
var templatizer = require('templatizer')
var LessImportInserter = require('less-import-inserter')
var jade = require('jade')

function fixPath (pathString) {
  return path.resolve(path.normalize(pathString))
}
function argv (flag) {
  return process.argv.slice(2).indexOf('--' + flag) > -1
}

var renderIndex = _.partial(jade.render, fs.readFileSync(fixPath('index.jade')))
var options = {build: argv('build'), minify: argv('minify')}
var config = {
  main: fixPath('client/app.js'),
  developmentMode: !options.minify,
  libraries: [
    fixPath('node_modules/jquery/dist/jquery.js'),
    fixPath('node_modules/bootstrap/js/transition.js'),
    fixPath('node_modules/bootstrap/js/dropdown.js'),
    fixPath('node_modules/bootstrap/js/collapse.js'),
    fixPath('node_modules/bootstrap/js/modal.js')
  ],
  stylesheets: [
    fixPath('node_modules/chessboardjs/www/css/chessboard.css'),
    fixPath('styles/app.css')
  ],
  beforeBuildJS: function (cb) {
    templatizer(
      fixPath('client/templates'),
      fixPath('client/templates.js'),
      { transformMixins: true },
      cb
    )
  },
  beforeBuildCSS: function (cb) {
    var bootstrapWithTheme = new LessImportInserter({
      lessPath: fixPath('node_modules/bootstrap/less/bootstrap.less'),
      relativeTo: fixPath('styles'),
      after: {variables: [
        'theme/yeti-theme.less',
        'theme/yeti-variables.less',
        'theme/override.less'
      ]},
      append: 'app/app.less'
    }).build()
    lessitizer({
      developmentMode: !options.minify,
      outputDir: fixPath('styles'),
      files: {
        less: bootstrapWithTheme,
        filename: 'app'
      }
    }, cb)
  }
}

if (options.build) {
  var Static = require('moonboots-static')
  // eslint-disable-next-line no-new
  new Static({
    verbose: true,
    moonboots: config,
    'public': fixPath('public'),
    directory: fixPath('build'),
    htmlSource: renderIndex,
    cb: function (err) {
      process.exit(err ? 1 : 0)
    }
  })
} else {
  var express = require('express')
  var Moonboots = require('moonboots-express')
  var port = process.env.PORT || 3000
  var expressApp = express()
  expressApp.use(express.static(fixPath('public')))
  // eslint-disable-next-line no-new
  new Moonboots({
    moonboots: config,
    render: function (req, res) {
      res.send(renderIndex(res.locals))
    },
    server: expressApp
  }).server.listen(port)
  console.log('Running at: http://localhost:' + port)
}
