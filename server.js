/* jshint node:true */

var express = require('express');
var Moonboots = require('moonboots-express');
var lessitizer = require('lessitizer');
var templatizer = require('templatizer');
var LessImportInserter = require('less-import-inserter');
var Static = require('moonboots-static');
var path = require('path');
var jade = require('jade');

function fixPath(pathString) {
    return path.resolve(path.normalize(pathString));
}
function quit(err) {
    process.exit(err ? 1 : 0);
}
function argv(flag) {
    return process.argv.join(' ').indexOf('--' + flag) > -1;
}

var index = require('fs').readFileSync(fixPath('index.jade'));
var renderIndex = function (ctx) { return jade.render(index, ctx); };
var port = process.env.PORT || 3000;
var appName = require('./package').name;
var options = {
    build: argv('build'),
    minify: argv('minify'),
    server: !argv('build') || argv('crawl'),
};


var config = {
    jsFileName: appName,
    cssFileName: appName,
    main: fixPath('client/app.js'),
    developmentMode: !options.minify,
    resourcePrefix: (options.build || options.crawl) ? '/assets/' : '/',
    libraries: [
        fixPath('node_modules/jquery/dist/jquery.js')
    ],
    stylesheets: [
        fixPath('styles/app.css')
    ],
    beforeBuildJS: function () {
        templatizer(fixPath('client/templates'), fixPath('client/templates.js'));
    },
    beforeBuildCSS: function (cb) {
        lessitizer({
            developmentMode: !options.minify,
            files: {
                less: new LessImportInserter({
                    lessPath: fixPath('node_modules/bootstrap/less/bootstrap.less'),
                    relativeTo: fixPath('styles'),
                    after: {
                        variables: 'theme/variables.less',
                    },
                    append: 'app/app.less'
                }).build(),
                filename: 'app'
            },
            outputDir: fixPath('styles')
        }, cb);
    }
};


if (options.build) {
    new Static({
        verbose: true,
        moonboots: config,
        'public': fixPath('public'),
        directory: fixPath('_deploy'),
        htmlSource: renderIndex,
        cb: quit
    });
}
else {
    var expressApp = express();
    expressApp.use(express.static(fixPath('public')));
    new Moonboots({
        moonboots: config,
        render: function (req, res) {
            res.send(renderIndex(res.locals));
        },
        server: expressApp
    }).server.listen(port);
    console.log('Running at: http://localhost:' + port);
}
