"use strict";
/**
 * This is the main entry point for preboot on the browser.
 * The primary methods are:
 *    init() - called automatically to initialize preboot according to options
 *    start() - when preboot should start listening to events
 *    done() - when preboot should start replaying events
 */
var dom = require('./dom');
var eventManager = require('./event_manager');
var bufferManager = require('./buffer_manager');
var logManager = require('./log');
var freezeSpin = require('./freeze/freeze_with_spinner');
// this is an impl of PrebootRef which can be passed into other client modules
// so they don't have to directly ref dom or log. this used so that users can
// write plugin strategies which get this object as an input param.
// note that log is defined this way because browserify can blank it out.
/* tslint:disable:no-empty */
var preboot = {
    dom: dom,
    log: logManager.log || function () { }
};
// in each client-side module, we store state in an object so we can mock
// it out during testing and easily reset it as necessary
var state = {
    canComplete: true,
    completeCalled: false,
    freeze: null,
    opts: null,
    started: false
};
/**
 * Once bootstrap has completed, we replay events,
 * switch buffer and then cleanup
 */
function complete() {
    preboot.log(2, eventManager.state.events);
    // track that complete has been called
    state.completeCalled = true;
    // if we can't complete (i.e. preboot paused), just return right away
    if (!state.canComplete) {
        return;
    }
    // else we can complete, so get started with events
    var opts = state.opts;
    eventManager.replayEvents(preboot, opts); // replay events on browser DOM
    if (opts.buffer) {
        bufferManager.switchBuffer(preboot);
    } // switch from server to browser buffer
    if (opts.freeze) {
        state.freeze.cleanup(preboot);
    } // cleanup freeze divs like overlay
    eventManager.cleanup(preboot, opts); // cleanup event listeners
}
exports.complete = complete;
/**
 * Get function to run once window has loaded
 */
function load() {
    var opts = state.opts;
    // re-initialize dom now that we have the body
    dom.init({ window: window });
    // grab the root element
    var root = dom.getDocumentNode(opts.appRoot);
    // make sure the app root is set
    dom.updateRoots(root, root, root);
    // if we are buffering, need to switch around the divs
    if (opts.buffer) {
        bufferManager.prep(preboot);
    }
    // if we could potentially freeze the UI, we need to prep (i.e. to add divs for overlay, etc.)
    // note: will need to alter this logic when we have more than one freeze strategy
    if (opts.freeze) {
        state.freeze = opts.freeze.name === 'spinner' ? freezeSpin : opts.freeze;
        state.freeze.prep(preboot, opts);
    }
    // start listening to events
    eventManager.startListening(preboot, opts);
}
/**
 * Resume the completion process; if complete already called,
 * call it again right away
 */
function resume() {
    state.canComplete = true;
    if (state.completeCalled) {
        // using setTimeout to fix weird bug where err thrown on
        // serverRoot.remove() in buffer switch
        setTimeout(complete, 10);
    }
}
/**
 * Initialization is really simple. Just save the options and set
 * the window object. Most stuff happens with start()
 */
function init(opts) {
    state.opts = opts;
    preboot.log(1, opts);
    dom.init({ window: window });
}
exports.init = init;
/**
 * Start preboot by starting to record events
 */
function start() {
    var opts = state.opts;
    // we can only start once, so don't do anything if called multiple times
    if (state.started) {
        return;
    }
    // initialize the window
    dom.init({ window: window });
    // load once the document ready
    dom.onLoad(load);
    // set up other handlers
    dom.on(opts.pauseEvent, function () { return state.canComplete = false; });
    dom.on(opts.resumeEvent, resume);
    dom.on(opts.completeEvent, complete);
}
exports.start = start;
//# sourceMappingURL=preboot_browser.js.map