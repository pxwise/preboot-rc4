"use strict";
// import all the listen and replay strategies here
// note: these will get filtered out by browserify at build time
var listenAttr = require('./listen/listen_by_attributes');
var listenEvt = require('./listen/listen_by_event_bindings');
var listenSelect = require('./listen/listen_by_selectors');
var replayHydrate = require('./replay/replay_after_hydrate');
var replayRerender = require('./replay/replay_after_rerender');
var caretPositionEvents = ['keyup', 'keydown', 'focusin', 'mouseup', 'mousedown'];
var caretPositionNodes = ['INPUT', 'TEXTAREA'];
// export state for testing purposes
exports.state = {
    eventListeners: [],
    events: [],
    listening: false
};
exports.strategies = {
    listen: {
        'attributes': listenAttr,
        'event_bindings': listenEvt,
        'selectors': listenSelect
    },
    replay: {
        'hydrate': replayHydrate,
        'rerender': replayRerender
    }
};
/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 */
function getEventHandler(preboot, strategy, node, eventName) {
    return function (event) {
        // if we aren't listening anymore (i.e. bootstrap complete) then don't capture any more events
        if (!exports.state.listening) {
            return;
        }
        // we want to wait until client bootstraps so don't allow default action
        if (strategy.preventDefault) {
            event.preventDefault();
        }
        // if we want to raise an event that others can listen for
        if (strategy.dispatchEvent) {
            preboot.dom.dispatchGlobalEvent(strategy.dispatchEvent);
        }
        // if callback provided for a custom action when an event occurs
        if (strategy.action) {
            strategy.action(preboot, node, event);
        }
        // this is for tracking focus; if no caret, then no active node; else set the node and node key
        if (caretPositionEvents.indexOf(eventName) < 0) {
            preboot.activeNode = null;
        }
        else {
            preboot.activeNode = {
                node: event.target,
                nodeKey: preboot.dom.getNodeKey(event.target, preboot.dom.state.serverRoot)
            };
        }
        // if event occurred that affects caret position in a node that we care about, record it
        if (caretPositionEvents.indexOf(eventName) >= 0 &&
            caretPositionNodes.indexOf(node.tagName) >= 0) {
            preboot.selection = preboot.dom.getSelection(node);
        }
        // todo: need another solution for this hack
        if (eventName === 'keyup' && event.which === 13 && node.attributes['(keyup.enter)']) {
            preboot.dom.dispatchGlobalEvent('PrebootFreeze');
        }
        // we will record events for later replay unless explicitly marked as doNotReplay
        if (!strategy.doNotReplay) {
            var eventObj = {
                node: node,
                event: event,
                name: eventName,
                time: preboot.time || (new Date()).getTime()
            };
            if (preboot &&
                preboot.dom &&
                preboot.dom.getNodeKey &&
                preboot.dom.state &&
                preboot.dom.state.serverRoot) {
                eventObj.nodeKey = preboot.dom.getNodeKey(node, preboot.dom.state.serverRoot);
            }
            exports.state.events.push(eventObj);
        }
    };
}
exports.getEventHandler = getEventHandler;
/**
 * Loop through node events and add listeners
 */
function addEventListeners(preboot, nodeEvents, strategy) {
    for (var _i = 0, nodeEvents_1 = nodeEvents; _i < nodeEvents_1.length; _i++) {
        var nodeEvent = nodeEvents_1[_i];
        var node = nodeEvent.node;
        var eventName = nodeEvent.eventName;
        var handler = getEventHandler(preboot, strategy, node, eventName);
        // add the actual event listener and keep a ref so we can remove the listener during cleanup
        node.addEventListener(eventName, handler);
        exports.state.eventListeners.push({
            node: node,
            name: eventName,
            handler: handler
        });
    }
}
exports.addEventListeners = addEventListeners;
/**
 * Add event listeners based on node events found by the listen strategies.
 * Note that the getNodeEvents fn is gathered here without many safety
 * checks because we are doing all of those in src/server/normalize.ts.
 */
function startListening(preboot, opts) {
    exports.state.listening = true;
    for (var _i = 0, _a = opts.listen; _i < _a.length; _i++) {
        var strategy = _a[_i];
        var getNodeEvents = strategy.getNodeEvents || exports.strategies.listen[strategy.name].getNodeEvents;
        var nodeEvents = getNodeEvents(preboot, strategy);
        addEventListeners(preboot, nodeEvents, strategy);
    }
}
exports.startListening = startListening;
/**
 * Loop through replay strategies and call replayEvents functions. In most cases
 * there will be only one replay strategy, but users may want to add multiple in
 * some cases with the remaining events from one feeding into the next.
 * Note that as with startListening() above, there are very little safety checks
 * here in getting the replayEvents fn because those checks are in normalize.ts.
 */
function replayEvents(preboot, opts) {
    exports.state.listening = false;
    for (var _i = 0, _a = opts.replay; _i < _a.length; _i++) {
        var strategy = _a[_i];
        var replayEvts = strategy.replayEvents || exports.strategies.replay[strategy.name].replayEvents;
        exports.state.events = replayEvts(preboot, strategy, exports.state.events);
    }
    // it is probably an error if there are remaining events, but just log for now
    preboot.log(5, exports.state.events);
}
exports.replayEvents = replayEvents;
/**
 * Go through all the event listeners and clean them up
 * by removing them from the given node (i.e. element)
 */
function cleanup(preboot, opts) {
    var activeNode = preboot.activeNode;
    // if there is an active node set, it means focus was tracked in one or more of the listen strategies
    if (activeNode) {
        // add small delay here so we are sure buffer switch is done
        setTimeout(function () {
            // find the client node in the new client view
            var activeClientNode = preboot.dom.findClientNode(activeNode.node, activeNode.nodeKey);
            if (activeClientNode) {
                preboot.dom.setSelection(activeClientNode, preboot.selection);
            }
            else {
                preboot.log(6, activeNode);
            }
        }, 1);
    }
    // cleanup the event listeners
    for (var _i = 0, _a = exports.state.eventListeners; _i < _a.length; _i++) {
        var listener = _a[_i];
        listener.node.removeEventListener(listener.name, listener.handler);
    }
    // finally clear out the events
    exports.state.events = [];
}
exports.cleanup = cleanup;
//# sourceMappingURL=event_manager.js.map