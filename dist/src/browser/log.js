"use strict";
function logOptions(opts) {
    console.log('preboot options are:');
    console.log(opts);
}
function logEvents(events) {
    console.log('preboot events captured are:');
    console.log(events);
}
function replaySuccess(serverNode, clientNode, event) {
    console.log('replaying:');
    console.log({
        serverNode: serverNode,
        clientNode: clientNode,
        event: event
    });
}
function missingClientNode(serverNode) {
    console.log('preboot could not find client node for:');
    console.log(serverNode);
}
function remainingEvents(events) {
    if (events && events.length) {
        console.log('the following events were not replayed:');
        console.log(events);
    }
}
function noRefocus(serverNode) {
    console.log('Could not find node on client to match server node for refocus:');
    console.log(serverNode);
}
var logMap = {
    '1': logOptions,
    '2': logEvents,
    '3': replaySuccess,
    '4': missingClientNode,
    '5': remainingEvents,
    '6': noRefocus
};
/**
 * Idea here is simple. If debugging turned on and this module exists, we
 * log various things that happen in preboot. The calling code only references
 * a number (keys in logMap) to a handling function. By doing this, we are
 * able to cut down on the amount of logging code in preboot when no in debug mode.
 */
function log() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    if (!args.length) {
        return;
    }
    var id = args[0] + '';
    var fn = logMap[id];
    if (fn) {
        fn.apply(void 0, args.slice(1));
    }
    else {
        console.log('log: ' + JSON.stringify(args));
    }
}
exports.log = log;
//# sourceMappingURL=log.js.map