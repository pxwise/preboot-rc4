"use strict";
var FUNC_START = 'START_FUNCTION_HERE';
var FUNC_STOP = 'STOP_FUNCTION_HERE';
/**
 * Stringify an object and include functions
 */
function stringifyWithFunctions(obj) {
    // first stringify except mark off functions with markers
    var str = JSON.stringify(obj, function (key, value) {
        // if the value is a function, we want to wrap it with markers
        if (!!(value && value.constructor && value.call && value.apply)) {
            return FUNC_START + value.toString() + FUNC_STOP;
        }
        else {
            return value;
        }
    });
    // now we use the markers to replace function strings with actual functions
    var startFuncIdx = str.indexOf(FUNC_START);
    var stopFuncIdx, fn;
    while (startFuncIdx >= 0) {
        stopFuncIdx = str.indexOf(FUNC_STOP);
        // pull string out
        fn = str.substring(startFuncIdx + FUNC_START.length, stopFuncIdx);
        fn = fn.replace(/\\n/g, '\n');
        str = str.substring(0, startFuncIdx - 1) + fn + str.substring(stopFuncIdx + FUNC_STOP.length + 1);
        startFuncIdx = str.indexOf(FUNC_START);
    }
    return str;
}
exports.stringifyWithFunctions = stringifyWithFunctions;
//# sourceMappingURL=utils.js.map