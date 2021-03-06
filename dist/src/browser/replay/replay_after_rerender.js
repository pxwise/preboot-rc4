"use strict";
/**
 * This replay strategy assumes that the browser completely re-rendered
 * the page so reboot will need to find the element in the new browser
 * rendered DOM that matches the element it has in memory.
 *
 * Any events that could not be replayed for whatever reason are returned.
 */
function replayEvents(preboot, strategy, events) {
    var remainingEvents = [];
    events = events || [];
    // loop through the events, find the appropriate browser node and dispatch the event
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var eventData = events_1[_i];
        var event_1 = eventData.event;
        var serverNode = eventData.node;
        var nodeKey = eventData.nodeKey;
        var clientNode = preboot.dom.findClientNode(serverNode, nodeKey);
        // if client node found, need to explicitly set value and then dispatch event
        if (clientNode) {
            clientNode.checked = serverNode.checked ? true : undefined;
            clientNode.selected = serverNode.selected ? true : undefined;
            clientNode.value = serverNode.value;
            clientNode.dispatchEvent(event_1);
            preboot.log(3, serverNode, clientNode, event_1);
        }
        else {
            remainingEvents.push(eventData);
            preboot.log(4, serverNode);
        }
    }
    return remainingEvents;
}
exports.replayEvents = replayEvents;
//# sourceMappingURL=replay_after_rerender.js.map