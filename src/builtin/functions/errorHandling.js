/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var PHPError = require('phpcommon').PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        errorConfiguration = internals.errorConfiguration,
        valueFactory = internals.valueFactory,
        // Maps the error type PHP constant name to the internal PHPError type that should be raised
        ERROR_CONSTANT_NAME_TO_LEVEL = {
            'E_USER_DEPRECATED': PHPError.E_DEPRECATED,
            'E_USER_ERROR': PHPError.E_ERROR,
            'E_USER_NOTICE': PHPError.E_NOTICE,
            'E_USER_WARNING': PHPError.E_WARNING
        };

    return {
        /**
         * Sets or determines which PHP errors will be reported
         *
         * @see {@link https://secure.php.net/manual/en/function.error-reporting.php}
         *
         * @returns {IntegerValue}
         */
        'error_reporting': function (levelReference) {
            var currentLevelValue = valueFactory.coerce(errorConfiguration.getErrorReportingLevel());

            if (!levelReference) {
                // When no argument is given, just return the current reporting level

                return currentLevelValue;
            }

            errorConfiguration.setErrorReportingLevel(levelReference.getValue().getNative());

            return currentLevelValue;
        },

        /**
         * Generates a user-level error/warning/notice message
         *
         * @see {@link https://secure.php.net/manual/en/function.trigger-error.php}
         *
         * @returns {BooleanValue}
         */
        'trigger_error': function (errorMessageReference, errorTypeReference) {
            var errorConstantName,
                errorLevel,
                errorMessage,
                errorType;

            errorMessage = errorMessageReference.getNative();
            errorType = errorTypeReference ? errorTypeReference.getNative() : null;

            if (errorType === null) {
                errorConstantName = 'E_USER_NOTICE';
            } else {
                errorConstantName = Object.keys(ERROR_CONSTANT_NAME_TO_LEVEL).find(function (constantName) {
                    return internals.getConstant(constantName) === errorType;
                });

                if (!errorConstantName) {
                    callStack.raiseError(PHPError.E_WARNING, 'Invalid error type specified');

                    return valueFactory.createBoolean(false);
                }
            }

            errorLevel = ERROR_CONSTANT_NAME_TO_LEVEL[errorConstantName];

            callStack.raiseError(errorLevel, errorMessage);

            return valueFactory.createBoolean(true);
        }
    };
};
