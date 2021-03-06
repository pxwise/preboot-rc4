"use strict";
/**
 * this replay strategy assumes that the browser did not blow away
 * the server generated HTML and that the elements in memory for
 * preboot can be used to replay the events.
 *
 * any events that could not be replayed for whatever reason are returned.
 */
function replayEvents(preboot, strategy, events) {
    var remainingEvents = [];
    events = events || [];
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var eventData = events_1[_i];
        var event_1 = eventData.event;
        var node = eventData.node;
        // if we should check to see if the node exists in the DOM before dispatching
        // note: this can be expensive so this option is false by default
        if (strategy.checkIfExists && !preboot.dom.appContains(node)) {
            remainingEvents.push(eventData);
        }
        else {
            node.dispatchEvent(event_1);
        }
    }
    return remainingEvents;
}
exports.replayEvents = replayEvents;
//# sourceMappingURL=replay_after_hydrate.js.map