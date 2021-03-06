"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    /**
     * Record key strokes in all textboxes and textareas as well as changes
     * in other form elements like checkboxes, radio buttons and select dropdowns
     */
    keyPress: function (opts) {
        opts.listen = opts.listen || [];
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input,textarea': ['keypress', 'keyup', 'keydown', 'input', 'change']
            }
        });
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'select,option': ['change']
            }
        });
    },
    /**
     * For focus option, the idea is to track focusin and focusout
     */
    focus: function (opts) {
        opts.listen = opts.listen || [];
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input,textarea': ['focusin', 'focusout', 'mousedown', 'mouseup']
            },
            trackFocus: true,
            doNotReplay: true
        });
    },
    /**
     * This option used for button press events
     */
    buttonPress: function (opts) {
        opts.listen = opts.listen || [];
        opts.listen.push({
            name: 'selectors',
            preventDefault: true,
            eventsBySelector: {
                'input[type="submit"],button': ['click']
            },
            dispatchEvent: opts.freeze && opts.freeze.eventName
        });
    },
    /**
     * This option will pause preboot and bootstrap processes
     * if focus on an input textbox or textarea
     */
    pauseOnTyping: function (opts) {
        opts.listen = opts.listen || [];
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input': ['focus'],
                'textarea': ['focus']
            },
            doNotReplay: true,
            dispatchEvent: opts.pauseEvent
        });
        opts.listen.push({
            name: 'selectors',
            eventsBySelector: {
                'input': ['blur'],
                'textarea': ['blur']
            },
            doNotReplay: true,
            dispatchEvent: opts.resumeEvent
        });
    }
};
//# sourceMappingURL=presets.js.map