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
    phpCommon = require('phpcommon'),
    slice = [].slice,
    Exception = phpCommon.Exception,
    PHPError = phpCommon.PHPError,

    CANNOT_START_ALREADY_STARTED_FIBER = 'core.cannot_start_already_started_fiber',
    CANNOT_SUSPEND_OUTSIDE_FIBER = 'core.cannot_suspend_outside_fiber',
    FIBER_NOT_STARTED = 'core.fiber_not_started',
    FIBER_NOT_SUSPENDED = 'core.fiber_not_suspended',
    FIBER_NOT_YET_RETURNED = 'core.fiber_not_yet_returned',
    FIBER_THREW_EXCEPTION = 'core.fiber_threw_exception';

module.exports = function (internals) {
    var callStack = internals.callStack,
        currentFiber = null,
        fiberStack = [],
        valueFactory = internals.valueFactory,

        /**
         * Enters the given Fiber; starting, resuming or throwing into it.
         *
         * @param {ObjectValue<Fiber>} fiberValue
         * @param {Function} entryCallback Callback to invoke once the Fiber has been entered.
         * @param {boolean=} useNewCoroutine
         * @returns {FutureInterface}
         */
        enterFiber = function (fiberValue, entryCallback, useNewCoroutine) {
            return valueFactory.createFuture(function (resolve, reject, nestCoroutine, newCoroutine) {
                function enterFiber() {
                    if (useNewCoroutine) {
                        newCoroutine({
                            /*
                             * Fibers are treated as nested inside their calling call stack:
                             * i.e. any exception stack trace should include the caller
                             *      that entered the Fiber via ->start(), ->resume() or ->throw().
                             */
                            keepStack: true
                        });
                    }

                    fiberStack.push(currentFiber);
                    currentFiber = fiberValue;
                }

                function leaveFiber() {
                    if (fiberStack.length === 0) {
                        throw new Exception('Invalid state: no previous fiber nor main thread to return to');
                    }

                    // Return to the previous fiber (if any).
                    currentFiber = fiberStack.pop();
                }

                fiberValue.setInternalProperty('entry', {
                    resolve: function returnFromFiber(result) {
                        leaveFiber();

                        resolve(result);
                    },
                    reject: function throwFromFiber(error) {
                        leaveFiber();

                        reject(error);
                    }
                });

                enterFiber();

                entryCallback();
            });
        };

    /**
     * Full-stack, interruptible functions.
     * Closer to coroutines than traditional fibers, as there is no scheduler.
     *
     * @see {@link https://secure.php.net/manual/en/class.fiber.php}
     * @param {Value} callbackValue
     * @constructor
     */
    function Fiber(callbackValue) {
        var fiberValue = this;

        fiberValue.setInternalProperty('callback', callbackValue);
        fiberValue.setInternalProperty('entry', null);
        fiberValue.setInternalProperty('return', null);
        fiberValue.setInternalProperty('started', false);
        fiberValue.setInternalProperty('suspension', null);
        fiberValue.setInternalProperty('threw', false);
    }

    _.extend(Fiber.prototype, {
        /**
         * Fetches the currently executing Fiber, or null if there is none.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.getcurrent.php}
         */
        'getCurrent': internals.typeStaticMethod(
            ': ?Fiber',
            function () {
                return currentFiber;
            }
        ),

        /**
         * Fetches the value returned by the fiber.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.getreturn.php}
         */
        'getReturn': internals.typeInstanceMethod(
            ': mixed',
            function () {
                var fiberValue = this,
                    returnValue = fiberValue.getInternalProperty('return');

                if (returnValue === null) {
                    callStack.raiseTranslatedError(
                        PHPError.E_ERROR,
                        fiberValue.getInternalProperty('started') ?
                            (
                                fiberValue.getInternalProperty('threw') ?
                                    FIBER_THREW_EXCEPTION :
                                    FIBER_NOT_YET_RETURNED
                            ) :
                            FIBER_NOT_STARTED,
                        {},
                        'FiberError'
                    );
                }

                return returnValue;
            }
        ),

        /**
         * Determines whether this fiber is currently running.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.isrunning.php}
         */
        'isRunning': internals.typeInstanceMethod(
            ': bool',
            function () {
                return this.getInternalProperty('entry') !== null;
            }
        ),

        /**
         * Determines whether this fiber has been started.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.isstarted.php}
         */
        'isStarted': internals.typeInstanceMethod(
            ': bool',
            function () {
                return this.getInternalProperty('started');
            }
        ),

        /**
         * Determines whether this fiber is currently suspended.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.issuspended.php}
         */
        'isSuspended': internals.typeInstanceMethod(
            ': bool',
            function () {
                return this.getInternalProperty('suspension') !== null;
            }
        ),

        /**
         * Determines whether this fiber has either returned or thrown.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.isterminated.php}
         */
        'isTerminated': internals.typeInstanceMethod(
            ': bool',
            function () {
                var fiberValue = this;

                return Boolean(
                    fiberValue.getInternalProperty('started') && (
                        fiberValue.getInternalProperty('return') ||
                        fiberValue.getInternalProperty('threw')
                    )
                );
            }
        ),

        /**
         * Resumes execution of this paused fiber.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.resume.php}
         */
        'resume': internals.typeInstanceMethod(
            'mixed $value = null : mixed',
            function (value) {
                var fiberValue = this,
                    suspensionContext = fiberValue.getInternalProperty('suspension');

                if (!suspensionContext) {
                    callStack.raiseTranslatedError(
                        PHPError.E_ERROR,
                        FIBER_NOT_SUSPENDED,
                        {},
                        'FiberError'
                    );
                }

                fiberValue.setInternalProperty('suspension', null);

                return enterFiber(
                    fiberValue,
                    function () {
                        suspensionContext.resolve(value);
                    }
                );
            }
        ),

        /**
         * Starts execution of this fiber.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.start.php}
         */
        'start': internals.typeInstanceMethod(
            ': mixed',
            function () {
                var fiberValue = this,
                    callbackArgs = slice.call(arguments),
                    callbackValue = fiberValue.getInternalProperty('callback');

                if (fiberValue.getInternalProperty('started')) {
                    callStack.raiseTranslatedError(
                        PHPError.E_ERROR,
                        CANNOT_START_ALREADY_STARTED_FIBER,
                        {},
                        'FiberError'
                    );
                }

                fiberValue.setInternalProperty('started', true);

                return enterFiber(
                    fiberValue,
                    function () {
                        callbackValue.call(callbackArgs)
                            .next(
                                function (returnValue) {
                                    var entryContext = fiberValue.getInternalProperty('entry');
                                    fiberValue.setInternalProperty('entry', null);

                                    // Fiber has returned: return null but store the return value
                                    // so that it may be fetched with ->getReturn().
                                    fiberValue.setInternalProperty('return', returnValue);

                                    entryContext.resolve();
                                },
                                function (error) {
                                    var entryContext = fiberValue.getInternalProperty('entry');
                                    fiberValue.setInternalProperty('entry', null);

                                    // Flag that the fiber finished by throwing.
                                    fiberValue.setInternalProperty('threw', true);

                                    entryContext.reject(error);
                                }
                            );
                    },
                    true
                );
            }
        ),

        /**
         * Suspends execution of the current fiber.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.suspend.php}
         */
        'suspend': internals.typeStaticMethod(
            'mixed $value = null : mixed',
            function (value) {
                var fiberValue;

                if (!currentFiber) {
                    callStack.raiseTranslatedError(
                        PHPError.E_ERROR,
                        CANNOT_SUSPEND_OUTSIDE_FIBER,
                        {},
                        'FiberError'
                    );
                }

                fiberValue = currentFiber;

                return valueFactory.createFuture(function (resolve, reject) {
                    var entryContext;

                    fiberValue.setInternalProperty('suspension', {
                        resolve: resolve,
                        reject: reject
                    });

                    entryContext = fiberValue.getInternalProperty('entry');
                    fiberValue.setInternalProperty('entry', null);

                    entryContext.resolve(value);
                });
            }
        ),

        /**
         * Resumes execution of this paused fiber by throwing a Throwable.
         *
         * @see {@link https://secure.php.net/manual/en/fiber.throw.php}
         */
        'throw': internals.typeInstanceMethod(
            'Throwable $exception : mixed',
            function (throwableValue) {
                var fiberValue = this,
                    suspensionContext = fiberValue.getInternalProperty('suspension');

                if (!suspensionContext) {
                    callStack.raiseTranslatedError(
                        PHPError.E_ERROR,
                        FIBER_NOT_SUSPENDED,
                        {},
                        'FiberError'
                    );
                }

                fiberValue.setInternalProperty('suspension', null);

                return enterFiber(
                    fiberValue,
                    function () {
                        suspensionContext.reject(throwableValue);
                    }
                );
            }
        )
    });

    internals.disableAutoCoercion();

    return Fiber;
};
