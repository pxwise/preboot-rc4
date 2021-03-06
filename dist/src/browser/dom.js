"use strict";
exports.nodeCache = {};
exports.state = {
    window: null,
    document: null,
    body: null,
    appRoot: null,
    serverRoot: null,
    clientRoot: null
};
/**
 * Initialize the DOM state based on input
 */
function init(opts) {
    exports.state.window = opts.window || exports.state.window || {};
    exports.state.document = opts.document || (exports.state.window && exports.state.window.document) || {};
    exports.state.body = opts.body || (exports.state.document && exports.state.document.body);
    exports.state.appRoot = opts.appRoot || exports.state.body;
    exports.state.serverRoot = exports.state.clientRoot = exports.state.appRoot;
}
exports.init = init;
/**
 * Setter for app root
 */
function updateRoots(appRoot, serverRoot, clientRoot) {
    exports.state.appRoot = appRoot;
    exports.state.serverRoot = serverRoot;
    exports.state.clientRoot = clientRoot;
}
exports.updateRoots = updateRoots;
/**
 * Get a node in the document
 */
function getDocumentNode(selector) {
    return exports.state.document.querySelector(selector);
}
exports.getDocumentNode = getDocumentNode;
/**
 * Get one app node
 */
function getAppNode(selector) {
    return exports.state.appRoot.querySelector(selector);
}
exports.getAppNode = getAppNode;
/**
 * Get all app nodes for a given selector
 */
function getAllAppNodes(selector) {
    return exports.state.appRoot.querySelectorAll(selector);
}
exports.getAllAppNodes = getAllAppNodes;
/**
 * Get all nodes under the client root
 */
function getClientNodes(selector) {
    return exports.state.clientRoot.querySelectorAll(selector);
}
exports.getClientNodes = getClientNodes;
/**
 * Add event listener at window level
 */
function onLoad(handler) {
    if (exports.state.document && exports.state.document.readyState === 'interactive') {
        handler();
    }
    else {
        exports.state.document.addEventListener('DOMContentLoaded', handler);
    }
}
exports.onLoad = onLoad;
/**
 * These are global events that get passed around. Currently
 * we use the document to do this.
 */
function on(eventName, handler) {
    exports.state.document.addEventListener(eventName, handler);
}
exports.on = on;
/**
 * Dispatch an event on the document
 */
function dispatchGlobalEvent(eventName) {
    exports.state.document.dispatchEvent(new exports.state.window.Event(eventName));
}
exports.dispatchGlobalEvent = dispatchGlobalEvent;
/**
 * Dispatch an event on a specific node
 */
function dispatchNodeEvent(node, eventName) {
    node.dispatchEvent(new exports.state.window.Event(eventName));
}
exports.dispatchNodeEvent = dispatchNodeEvent;
/**
 * Check to see if the app contains a particular node
 */
function appContains(node) {
    return exports.state.appRoot.contains(node);
}
exports.appContains = appContains;
/**
 * Create a new element
 */
function addNodeToBody(type, className, styles) {
    var elem = exports.state.document.createElement(type);
    elem.className = className;
    if (styles) {
        for (var key in styles) {
            if (styles.hasOwnProperty(key)) {
                elem.style[key] = styles[key];
            }
        }
    }
    return exports.state.body.appendChild(elem);
}
exports.addNodeToBody = addNodeToBody;
/**
 * Remove a node since we are done with it
 */
function removeNode(node) {
    if (!node) {
        return;
    }
    node.remove ?
        node.remove() :
        node.style.display = 'none';
}
exports.removeNode = removeNode;
/**
 * Get the caret position within a given node. Some hackery in
 * here to make sure this works in all browsers
 */
function getSelection(node) {
    var selection = {
        start: 0,
        end: 0,
        direction: 'forward'
    };
    // if browser support selectionStart on node (Chrome, FireFox, IE9+)
    if (node && (node.selectionStart || node.selectionStart === 0)) {
        selection.start = node.selectionStart;
        selection.end = node.selectionEnd;
        selection.direction = node.selectionDirection;
    }
    else if (node && node.value) {
        selection.start = selection.end = node.value.length;
    }
    return selection;
}
exports.getSelection = getSelection;
/**
 * Set caret position in a given node
 */
function setSelection(node, selection) {
    // as long as node exists, set focus
    if (node) {
        node.focus();
    }
    // set selection if a modern browser (i.e. IE9+, etc.)
    if (node && node.setSelectionRange && selection) {
        node.setSelectionRange(selection.start, selection.end, selection.direction);
    }
}
exports.setSelection = setSelection;
/**
 * Get a unique key for a node in the DOM
 */
function getNodeKey(node, rootNode) {
    var ancestors = [];
    var temp = node;
    while (temp && temp !== rootNode) {
        ancestors.push(temp);
        temp = temp.parentNode;
    }
    // push the rootNode on the ancestors
    if (temp) {
        ancestors.push(temp);
    }
    // now go backwards starting from the root
    var key = node.nodeName;
    var len = ancestors.length;
    for (var i = (len - 1); i >= 0; i--) {
        temp = ancestors[i];
        if (temp.childNodes && i > 0) {
            for (var j = 0; j < temp.childNodes.length; j++) {
                if (temp.childNodes[j] === ancestors[i - 1]) {
                    key += '_s' + (j + 1);
                    break;
                }
            }
        }
    }
    return key;
}
exports.getNodeKey = getNodeKey;
/**
 * Given a node from the server rendered view, find the equivalent
 * node in the client rendered view.
 */
function findClientNode(serverNode, nodeKey) {
    // if nothing passed in, then no client node
    if (!serverNode) {
        return null;
    }
    // we use the string of the node to compare to the client node & as key in cache
    var serverNodeKey = nodeKey || getNodeKey(serverNode, exports.state.serverRoot);
    // first check to see if we already mapped this node
    var nodes = exports.nodeCache[serverNodeKey] || [];
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var nodeMap = nodes_1[_i];
        if (nodeMap.serverNode === serverNode) {
            return nodeMap.clientNode;
        }
    }
    // todo: improve this algorithm in the future so uses fuzzy logic (i.e. not necessarily perfect match)
    var selector = serverNode.tagName;
    var className = (serverNode.className || '').replace('ng-binding', '').trim();
    if (serverNode.id) {
        selector += '#' + serverNode.id;
    }
    else if (className) {
        selector += '.' + className.replace(/ /g, '.');
    }
    var clientNodes = getClientNodes(selector);
    for (var _a = 0, clientNodes_1 = clientNodes; _a < clientNodes_1.length; _a++) {
        var clientNode = clientNodes_1[_a];
        // todo: this assumes a perfect match which isn't necessarily true
        if (getNodeKey(clientNode, exports.state.clientRoot) === serverNodeKey) {
            // add the client/server node pair to the cache
            exports.nodeCache[serverNodeKey] = exports.nodeCache[serverNodeKey] || [];
            exports.nodeCache[serverNodeKey].push({
                clientNode: clientNode,
                serverNode: serverNode
            });
            return clientNode;
        }
    }
    // if we get here it means we couldn't find the client node
    return null;
}
exports.findClientNode = findClientNode;
//# sourceMappingURL=dom.js.map