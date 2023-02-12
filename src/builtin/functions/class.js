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
    PHPError = phpCommon.PHPError,
    GET_CLASS_WITHOUT_ARGS_OUTSIDE_CLASS = 'core.get_class_without_args_outside_class',
    INVALID_VALUE_FOR_TYPE_BUILTIN = 'core.invalid_value_for_type_builtin';

module.exports = function (internals) {
    var callStack = internals.callStack,
        classAutoloader = internals.classAutoloader,
        globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Determines whether the specified class exists.
         *
         * @see {@link https://secure.php.net/manual/en/function.class-exists.php}
         */
        'class_exists': internals.typeFunction(
            'string $class, bool $autoload = true : bool',
            function (classNameValue, callAutoloaderValue) {
                var className = classNameValue.getNative(),
                    callAutoloader = callAutoloaderValue ? callAutoloaderValue.getNative() : true;

                function getClass() {
                    return valueFactory.createBoolean(globalNamespace.hasClass(className));
                }

                // Autoload the class if not already defined and autoloading is requested.
                if (!globalNamespace.hasClass(className) && callAutoloader) {
                    return classAutoloader.autoloadClass(className)
                        .next(getClass);
                }

                return getClass();
            }
        ),

        /**
         * Fetches the name of either the current class or the class of a specified object.
         *
         * TODO: Add the ability to specify multiple signatures so that .typeFunction(...) may be used here.
         *
         * @see {@link https://secure.php.net/manual/en/function.get-class.php}
         *
         * @param {Variable|Value} objectReference
         * @returns {StringValue}
         */
        'get_class': function (objectReference) {
            var currentClass,
                objectValue;

            if (!objectReference) {
                currentClass = callStack.getCallerScope().getCurrentClass();

                if (!currentClass) {
                    callStack.raiseTranslatedError(
                        PHPError.E_ERROR,
                        GET_CLASS_WITHOUT_ARGS_OUTSIDE_CLASS
                    );
                }

                return valueFactory.createString(currentClass.getName());
            }

            objectValue = objectReference.getValue();

            if (objectValue.getType() !== 'object') {
                // If specified, the value must be an object.
                // Null cannot be specified, the argument must instead be omitted.
                callStack.raiseTranslatedError(
                    PHPError.E_ERROR,
                    INVALID_VALUE_FOR_TYPE_BUILTIN,
                    {
                        func: 'get_class',
                        index: 1,
                        name: 'object',
                        expectedType: 'of type object',
                        actualType: objectValue.getType()
                    },
                    'TypeError'
                );
            }

            return valueFactory.createString(objectValue.getClassName());
        },

        /**
         * Checks if the object is of this class or has this class as one of its parents.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-a.php}
         */
        'is_a': internals.typeFunction(
            'mixed $object_or_class, string $class, bool $allow_string = false : bool',
            function (objectValue, classNameValue, allowStringValue) {
                var className = classNameValue.getNative(),
                    allowString = allowStringValue.getNative();

                if (objectValue.getType() === 'object') {
                    return valueFactory.createBoolean(objectValue.classIs(className));
                }

                if (objectValue.getType() === 'string') {
                    if (!allowString) {
                        // First arg is not allowed to be a string - just return false (no warning/notice).
                        return valueFactory.createBoolean(false);
                    }

                    return globalNamespace.getClass(objectValue.getNative())
                        .next(function (classObject) {
                            return valueFactory.createBoolean(classObject.is(className));
                        });
                }

                // Invalid "object" given - just return false (no warning/notice).
                return valueFactory.createBoolean(false);
            }
        )
    };
};
