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
    CallbackValue = require('./functionHandling/CallbackValue'),
    PHPError = require('phpcommon').PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Calls the specified function, returning its result
         *
         * @see {@link https://secure.php.net/manual/en/function.call-user-func.php}
         *
         * @param {Variable|Value} callbackReference       The function or callable to call
         * @param {...Variable|...Value} argumentReference Variable no. of arguments to pass to the callable
         * @returns {Value}
         */
        'call_user_func': function (callbackReference, argumentReference) { //jshint ignore:line
            var callbackValue = callbackReference.getValue(),
                expectedReferenceArgumentIndex = null,
                expectedReferenceError = {},
                argumentValues = _.map(
                    [].slice.call(arguments, 1),
                    function (argumentReference, argumentIndex) {
                        return new CallbackValue(
                            function () {
                                expectedReferenceArgumentIndex = argumentIndex;
                                throw expectedReferenceError;
                            },
                            function () {
                                return argumentReference.getValue();
                            }
                        );
                    }
                );

            try {
                return callbackValue.call(argumentValues, globalNamespace);
            } catch (error) {
                // Allow any other errors through
                if (error !== expectedReferenceError) {
                    throw error;
                }

                callStack.raiseError(
                    PHPError.E_WARNING,
                    'Parameter ' + (expectedReferenceArgumentIndex + 1) +
                        ' to ' + callbackValue.getCallableName(globalNamespace) +
                        '() expected to be a reference, value given'
                );

                return valueFactory.createNull();
            }
        },
        /**
         * Calls the specified function, returning its result
         *
         * @see {@link https://secure.php.net/manual/en/function.call-user-func-array.php}
         *
         * @param {Variable|Value} callbackReference      The function or callable to call
         * @param {Variable|Value} argumentArrayReference An array of arguments to pass to the callable
         * @returns {Value}
         */
        'call_user_func_array': function (callbackReference, argumentArrayReference) {
            var callbackValue = callbackReference.getValue(),
                argumentArrayValue = argumentArrayReference.getValue(),
                argumentValues = argumentArrayValue.getValueReferences();

            return callbackValue.call(argumentValues, globalNamespace);
        },

        /**
         * Fetches an array containing all arguments passed to the function.
         * If called from outside a function, FALSE will be returned.
         *
         * @see {@link https://secure.php.net/manual/en/function.func-get-args.php}
         *
         * @returns {ArrayValue|BooleanValue}
         */
        'func_get_args': function () {
            var callerCall = callStack.getCaller();

            if (callerCall === null) {
                // We're not in a function scope - no args to get

                callStack.raiseError(
                    PHPError.E_WARNING,
                    'func_get_args(): Called from the global scope - no function context'
                );

                return valueFactory.createBoolean(false);
            }

            return valueFactory.createArray(callerCall.getFunctionArgs());
        },

        /**
         * Fetches the number of arguments passed to the function.
         *
         * @see {@link https://secure.php.net/manual/en/function.func-num-args.php}
         *
         * @returns {IntegerValue}
         */
        'func_num_args': function () {
            var callerCall = callStack.getCaller();

            if (callerCall === null) {
                // We're not in a function scope - no args to get

                callStack.raiseError(
                    PHPError.E_WARNING,
                    'func_num_args(): Called from the global scope - no function context'
                );

                return valueFactory.createInteger(-1);
            }

            return valueFactory.createInteger(callerCall.getFunctionArgs().length);
        },

        /**
         * Determines whether the specified function exists,
         * returning true if so and false otherwise
         *
         * @see {@link https://secure.php.net/manual/en/function.function-exists.php}
         *
         * @param {Variable|Value} nameReference The name of the function to check for
         * @returns {BooleanValue}
         */
        'function_exists': function (nameReference) {
            var name = nameReference.getValue().getNative().replace(/^\\/, '');

            return valueFactory.createBoolean(globalNamespace.hasFunction(name));
        }
    };
};
