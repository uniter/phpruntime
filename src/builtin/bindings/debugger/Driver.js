/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    EventEmitter = require('events').EventEmitter,
    hasOwn = {}.hasOwnProperty,
    STATE_NOT_YET_ATTACHED = 'not yet attached',
    STATE_RUNNING = 'running',
    STATE_PAUSED = 'paused',
    STATE_STEPPING_INTO = 'stepping into',
    STATE_STEPPING_OVER = 'stepping over';

/**
 * Represents the debugger driver engine for a given PHP script
 *
 * @param {CallStack} callStack
 * @param {Resumable} pausable
 * @param {object} options
 * @constructor
 */
function Driver(callStack, pausable, options) {
    /**
     * @type {CallStack}
     */
    this.callStack = callStack;
    /**
     * @type {number|null}
     */
    this.callStackLength = null;
    /**
     * @type {Call|null}
     */
    this.currentCall = null;
    /**
     * @type {PauseException|null}
     */
    this.currentPause = null;
    /**
     * @type {EventEmitter}
     */
    this.eventEmitter = new EventEmitter();
    /**
     * @type {Object}
     */
    this.lineBreakpoints = {};
    /**
     * @type {Object}
     */
    this.options = _.extend({
        onAttach: function () {}
    }, options);
    /**
     * @type {Resumable}
     */
    this.pausable = pausable;
    /**
     * @type {string}
     */
    this.state = STATE_NOT_YET_ATTACHED;

    if (hasOwn.call(this.options, 'onAttach')) {
        this.eventEmitter.on('attach', this.options.onAttach);
    }
}

_.extend(Driver.prototype, {
    /**
     * Adds a breakpoint for a specific line in a PHP file
     *
     * @param {string} file
     * @param {number} line
     */
    addLineBreakpoint: function (file, line) {
        var driver = this;

        if (!hasOwn.call(driver.lineBreakpoints, file)) {
            driver.lineBreakpoints[file] = {};
        }

        driver.lineBreakpoints[file][line] = true;
    },

    /**
     * Adds a listener for a debugging engine event
     *
     * @param {string} eventName
     * @param {Function} listener
     */
    on: function (eventName, listener) {
        this.eventEmitter.on(eventName, listener);
    },

    /**
     * Pauses the current call stack and marks the engine as paused
     *
     * Note: this will pause the current JS call stack too,
     *       so any other logic should be run in the caller before calling this method
     */
    pause: function () {
        var driver = this,
            pause;

        if (driver.state === STATE_PAUSED) {
            throw new Error('Unable to pause as engine is already paused');
        }

        pause = driver.pausable.createPause();
        driver.currentPause = pause;
        driver.state = STATE_PAUSED;
        pause.now();
    },

    /**
     * Removes a listener previously added for a debugging engine event
     *
     * @param {string} eventName
     * @param {Function} listener
     */
    removeListener: function (eventName, listener) {
        this.eventEmitter.removeListener(eventName, listener);
    },

    /**
     * Resumes execution after it has been paused
     */
    resume: function () {
        var driver = this,
            currentPause = driver.currentPause;

        if (driver.state !== STATE_NOT_YET_ATTACHED && driver.state !== STATE_PAUSED) {
            throw new Error('Unable to resume as engine is not paused');
        }

        driver.currentCall = null;
        driver.callStackLength = null;
        driver.currentPause = null;
        driver.state = STATE_RUNNING;
        currentPause.resume();
    },

    /**
     * Steps into the first function call in the current statement and pauses before its first statement,
     * or if there is no function call then behaves the same as a step-over
     */
    stepInto: function () {
        var driver = this,
            currentPause = driver.currentPause;

        if (driver.state !== STATE_NOT_YET_ATTACHED && driver.state !== STATE_PAUSED) {
            throw new Error('Unable to step into as engine is not paused');
        }

        driver.currentCall = null;
        driver.callStackLength = null;
        driver.currentPause = null;
        driver.state = STATE_STEPPING_INTO;
        currentPause.resume();
    },

    /**
     * Steps over the next statement in the current scope, or to the next statement
     * in the calling scope if we were on the last one in the current scope
     */
    stepOver: function () {
        var driver = this,
            currentPause = driver.currentPause;

        if (driver.state !== STATE_NOT_YET_ATTACHED && driver.state !== STATE_PAUSED) {
            throw new Error('Unable to step over as engine is not paused');
        }

        // Record the current call and stack length, so we can work out when we've returned back to the current scope
        // or to the previous scope if this was the last statement in the current one
        driver.currentCall = driver.callStack.getCurrent();
        driver.callStackLength = driver.callStack.getLength();

        driver.currentPause = null;
        driver.state = STATE_STEPPING_OVER;
        currentPause.resume();
    },

    /**
     * Notifies the debugging engine that a statement in the PHP script has been executed
     *
     * @param {string} path Path to the PHP script
     * @param {number} startLine Line that the statement starts on
     * @param {number} startColumn Column that the statement starts at
     * @param {number} endLine Line that the statement finishes on (often the same as the start line)
     * @param {number} endColumn Column that the statement finishes at
     */
    tick: function (path, startLine, startColumn, endLine, endColumn) {
        var doPause = true,
            driver = this;

        function checkForBreakpoint() {
            if (
                hasOwn.call(driver.lineBreakpoints, path) &&
                // Only the start line of the statement can have a breakpoint set on it
                hasOwn.call(driver.lineBreakpoints[path], startLine)
            ) {
                // Breakpoint hit!
                driver.eventEmitter.emit('line_breakpoint', path, startLine, startColumn, endLine, endColumn, function () {
                    doPause = false;
                });

                if (doPause) {
                    // No breakpoint listener prevented the pause
                    driver.pause();
                }
            }
        }

        switch (driver.state) {
            case STATE_NOT_YET_ATTACHED:
                setTimeout(function () {
                    driver.eventEmitter.emit('attach', driver);
                }, 1);

                // Execution has just started - pause before executing the very first statement
                // and wait for the IDE to continue execution
                driver.pause();
                return;
            case STATE_STEPPING_INTO:
                setTimeout(function () {
                    driver.eventEmitter.emit('stepped_into', path, startLine, startColumn, endLine, endColumn);
                }, 1);

                // Just pause before the very next statement for a step-into
                driver.pause();
                return;
            case STATE_STEPPING_OVER:
                // Any breakpoint encountered during a step over (eg. a breakpoint
                // inside the function call being skipped over) should change the step-over
                // into a normal break state at the breakpoint
                checkForBreakpoint();

                if (
                    // Execution returned to the current function
                    driver.callStack.getCurrent() === driver.currentCall ||
                    // Execution returned to the caller or its caller etc. (ie. when we stepped over,
                    // we were already on the last statement of the current function)
                    driver.callStack.getLength() < driver.callStackLength
                ) {
                    setTimeout(function () {
                        driver.eventEmitter.emit('stepped_over', path, startLine, startColumn, endLine, endColumn);
                    }, 1);

                    // We've finished stepping over the statement, so pause execution again
                    driver.pause();
                }
                break;
            case STATE_RUNNING:
                checkForBreakpoint();
                break;
            default:
                throw new Error('Tick during unexpected state "' + driver.state + '"');
        }
    }
});

module.exports = Driver;
