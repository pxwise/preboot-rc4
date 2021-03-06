"use strict";
// overlay and spinner nodes stored in memory in between prep and cleanup
exports.state = {
    overlay: null,
    spinner: null
};
/**
 * Clean up the freeze elements from the DOM
 */
function cleanup(preboot) {
    preboot.dom.removeNode(exports.state.overlay);
    preboot.dom.removeNode(exports.state.spinner);
    exports.state.overlay = null;
    exports.state.spinner = null;
}
exports.cleanup = cleanup;
/**
 * Prepare for freeze by adding elements to the DOM and adding an event handler
 */
function prep(preboot, opts) {
    var freezeOpts = opts.freeze || {};
    var freezeStyles = freezeOpts.styles || {};
    var overlayStyles = freezeStyles.overlay || {};
    var spinnerStyles = freezeStyles.spinner || {};
    // add the overlay and spinner to the end of the body
    exports.state.overlay = preboot.dom.addNodeToBody('div', overlayStyles.className, overlayStyles.style);
    exports.state.spinner = preboot.dom.addNodeToBody('div', spinnerStyles.className, spinnerStyles.style);
    // when a freeze event occurs, show the overlay and spinner
    preboot.dom.on(freezeOpts.eventName, function () {
        // if there is an active node, position spinner on top of it and blur the focus
        var activeNode = preboot.activeNode;
        if (activeNode) {
            exports.state.spinner.style.top = activeNode.offsetTop;
            exports.state.spinner.style.left = activeNode.offsetLeft;
            if (freezeOpts.doBlur) {
                activeNode.blur();
            }
        }
        // display the overlay and spinner
        exports.state.overlay.style.display = 'block';
        exports.state.spinner.style.display = 'block';
        // preboot should end in under 5 seconds, but if it doesn't unfreeze just in case  
        setTimeout(function () { return cleanup(preboot); }, freezeOpts.timeout);
    });
}
exports.prep = prep;
//# sourceMappingURL=freeze_with_spinner.js.map