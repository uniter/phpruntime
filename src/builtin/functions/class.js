/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpCommon = require('phpcommon'),
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        classAutoloader = internals.classAutoloader,
        globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Determines whether the specified class exists
         *
         * @see {@link https://secure.php.net/manual/en/function.class-exists.php}
         *
         * @param {Variable|Value} classNameReference      The name of the class to check for
         * @param {Variable|Value} callAutoloaderReference True to invoke the autoloader, false otherwise
         * @returns {BooleanValue}
         */
        'class_exists': function (classNameReference, callAutoloaderReference) {
            var className = classNameReference.getNative(),
                callAutoloader = callAutoloaderReference ? callAutoloaderReference.getNative() : true;

            // Autoload the class if not already defined and autoloading is requested
            if (!globalNamespace.hasClass(className) && callAutoloader) {
                classAutoloader.autoloadClass(className);
            }

            return valueFactory.createBoolean(globalNamespace.hasClass(className));
        },

        /**
         * Fetches the name of either the current class or the class of a specified object
         *
         * @see {@link https://secure.php.net/manual/en/function.get-class.php}
         *
         * @param {Variable|Value} objectReference
         * @returns {StringValue|BooleanValue}
         */
        'get_class': function (objectReference) {
            var currentClass,
                objectValue;

            if (!objectReference) {
                currentClass = callStack.getCallerScope().getCurrentClass();

                if (!currentClass) {
                    callStack.raiseError(
                        PHPError.E_WARNING,
                        'get_class() called without object from outside a class'
                    );

                    return valueFactory.createBoolean(false);
                }

                return valueFactory.createString(currentClass.getName());
            }

            objectValue = objectReference.getValue();

            if (objectValue.getType() !== 'object') {
                // If specified, the value must be an object
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'get_class() expects parameter 1 to be object, ' + objectValue.getType() + ' given'
                );

                return valueFactory.createBoolean(false);
            }

            return valueFactory.createString(objectValue.getClassName());
        },

        /**
         * Checks if the object is of this class or has this class as one of its parents
         *
         * @see {@link https://secure.php.net/manual/en/function.is-a.php}
         *
         * @param {Variable|Value} objectReference
         * @param {Variable|Value} classNameReference
         * @param {Variable|Value} allowStringReference
         * @returns {BooleanValue}
         */
        'is_a': function (objectReference, classNameReference, allowStringReference) {
            var allowString,
                className,
                classNameValue,
                objectValue;

            objectValue = objectReference.getValue();
            classNameValue = classNameReference.getValue();

            className = classNameValue.getNative();
            allowString = allowStringReference ? allowStringReference.getNative() : false;

            if (objectValue.getType() === 'object') {
                return valueFactory.createBoolean(objectValue.classIs(className));
            }

            if (objectValue.getType() === 'string') {
                if (!allowString) {
                    // First arg is not allowed to be a string - just return false (no warning/notice)
                    return valueFactory.createBoolean(false);
                }

                return valueFactory.createBoolean(
                    globalNamespace.getClass(objectValue.getNative()).is(className)
                );
            }

            // Invalid "object" given - just return false (no warning/notice)
            return valueFactory.createBoolean(false);
        }
    };
};
