"use strict";
var Q = require('q');
var rename = require('gulp-rename'); // hack to get working
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');
var eventStream = require('event-stream');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var normalize_1 = require('./normalize');
var utils_1 = require('./utils');
// map of input opts to browser code; exposed for testing purposes
exports.browserCodeCache = {};
/**
 * We want to use the browserify ignore functionality so that any code modules
 * that are not being used are stubbed out. So, for example, if in the preboot
 * options the only listen strategy is selectors, then the event_bindings and
 * attributes strategies will be stubbed out (meaing the refs will be {})
 */
function ignoreUnusedStrategies(b, /*Browserify.BrowserifyObject*/ bOpts, strategyOpts, allStrategies, pathPrefix) {
    var activeStrategies = strategyOpts
        .filter(function (x) { return x.name; })
        .map(function (x) { return x.name; });
    Object.keys(allStrategies)
        .filter(function (x) { return activeStrategies.indexOf(x) < 0; })
        .forEach(function (x) { return b.ignore(pathPrefix + x + '.js', bOpts); });
}
exports.ignoreUnusedStrategies = ignoreUnusedStrategies;
/**
 * Generate browser code as a readable stream for preboot based on the input options
 */
function getBrowserCodeStream(opts) {
    opts = normalize_1.normalize(opts);
    var bOpts = {
        entries: [__dirname + '/../browser/preboot_browser.js'],
        standalone: 'preboot',
        basedir: __dirname + '/../browser',
        browserField: false
    };
    var b = browserify(bOpts);
    // ignore any strategies that are not being used
    ignoreUnusedStrategies(b, bOpts, opts.listen, normalize_1.listenStrategies, './listen/listen_by_');
    ignoreUnusedStrategies(b, bOpts, opts.replay, normalize_1.replayStrategies, './replay/replay_after_');
    if (opts.freeze) {
        ignoreUnusedStrategies(b, bOpts, [opts.freeze], normalize_1.freezeStrategies, './freeze/freeze_with_');
    }
    // ignore other code not being used
    if (!opts.buffer) {
        b.ignore('./buffer_manager.js', bOpts);
    }
    if (!opts.debug) {
        b.ignore('./log.js', bOpts);
    }
    // use gulp to get the stream with the custom preboot browser code
    var outputStream = b.bundle()
        .pipe(source('src/browser/preboot_browser.js'))
        .pipe(buffer())
        .pipe(insert.append('\n\n;preboot.init(' + utils_1.stringifyWithFunctions(opts) + ');\n\n'))
        .pipe(rename('preboot.js'));
    // uglify if the option is passed in
    return opts.uglify ? outputStream.pipe(uglify()) : outputStream;
}
exports.getBrowserCodeStream = getBrowserCodeStream;
// TODO: remove
exports.getClientCodeStream = getBrowserCodeStream;
/**
 * Generate browser code as a string for preboot
 * based on the input options
 */
function getBrowserCode(opts, done) {
    var deferred = Q.defer();
    var clientCode = '';
    // check cache first (as long as it wasn't disabled)
    var cacheKey = JSON.stringify(opts);
    if (!opts.disableCodeCache && exports.browserCodeCache[cacheKey]) {
        return Q.when(exports.browserCodeCache[cacheKey]);
    }
    // get the browser code
    getBrowserCodeStream(opts)
        .pipe(eventStream.map(function (file, cb) {
        clientCode += file.contents;
        cb(null, file);
    }))
        .once('error', function (err) {
        if (done) {
            done(err);
        }
        deferred.reject(err);
    })
        .once('end', function () {
        if (done) {
            done(null, clientCode);
        }
        exports.browserCodeCache[cacheKey] = clientCode;
        deferred.resolve(clientCode);
    });
    return deferred.promise;
}
exports.getBrowserCode = getBrowserCode;
exports.getClientCode = getBrowserCode;
//# sourceMappingURL=browser_code_generator.js.map
