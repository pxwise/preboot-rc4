"use strict";
// expose state for testing purposes
exports.state = { switched: false };
/**
 * Create a second div that will be the client root for an app
 */
function prep(preboot) {
    // server root is the app root when we get started
    var serverRoot = preboot.dom.state.appRoot;
    // client root is going to be a shallow clone of the server root
    var clientRoot = serverRoot.cloneNode(false);
    // client in the DOM, but not displayed until time for switch
    clientRoot.style.display = 'none';
    // insert the client root right before the server root
    serverRoot.parentNode.insertBefore(clientRoot, serverRoot);
    // update the dom manager to store the server and client roots (first param is appRoot)
    preboot.dom.updateRoots(serverRoot, serverRoot, clientRoot);
}
exports.prep = prep;
/**
 * We want to simultaneously remove the server node from the DOM
 * and display the client node
 */
function switchBuffer(preboot) {
    var domState = preboot.dom.state;
    // get refs to the roots
    var clientRoot = domState.clientRoot || domState.appRoot;
    var serverRoot = domState.serverRoot || domState.appRoot;
    // don't do anything if already switched
    if (exports.state.switched) {
        return;
    }
    // remove the server root if not same as client and not the body
    if (serverRoot !== clientRoot && serverRoot.nodeName !== 'BODY') {
        preboot.dom.removeNode(serverRoot);
    }
    // display the client
    clientRoot.style.display = 'block';
    // update the roots; first param is the new appRoot; serverRoot now null
    preboot.dom.updateRoots(clientRoot, null, clientRoot);
    // finally mark state as switched
    exports.state.switched = true;
}
exports.switchBuffer = switchBuffer;
//# sourceMappingURL=buffer_manager.js.map