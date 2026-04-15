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
    PHPError = phpCommon.PHPError,

    REFLECTION_METHOD_NOT_FOUND = 'core.reflection_method_not_found';

module.exports = function (internals) {
    var callStack = internals.callStack,
        globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    /**
     * Provides information about a class method.
     *
     * @see {@link https://secure.php.net/manual/en/class.reflectionmethod.php}
     * @constructor
     */
    function ReflectionMethod() {
        // Internal state is set in __construct.
    }

    // Method visibility filter constants.
    internals.defineConstant('IS_ABSTRACT', 64);
    internals.defineConstant('IS_FINAL', 32);
    internals.defineConstant('IS_PRIVATE', 4);
    internals.defineConstant('IS_PROTECTED', 2);
    internals.defineConstant('IS_PUBLIC', 1);
    internals.defineConstant('IS_STATIC', 16);

    _.extend(ReflectionMethod.prototype, {
        /**
         * Constructs a ReflectionMethod for the given class and method.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.construct.php}
         */
        '__construct': internals.typeInstanceMethod(
            'mixed $objectOrMethod, string $method : void',
            function (objectOrMethodValue, methodNameValue) {
                var reflectionMethodValue = this,
                    className,
                    methodName = methodNameValue.getNative();

                if (objectOrMethodValue.getType() === 'object') {
                    className = objectOrMethodValue.getClassName();
                } else {
                    className = objectOrMethodValue.getNative();
                }

                return globalNamespace.getClass(className)
                    .next(function (classObject) {
                        var callable = classObject.getMethodCallable(methodName);

                        if (!callable) {
                            callStack.raiseTranslatedError(
                                PHPError.E_ERROR,
                                REFLECTION_METHOD_NOT_FOUND,
                                {
                                    className: className,
                                    methodName: methodName
                                },
                                'ReflectionException'
                            );
                        }

                        reflectionMethodValue.setInternalProperty('callable', callable);
                        reflectionMethodValue.setInternalProperty('class', classObject);
                        reflectionMethodValue.setInternalProperty('methodName', methodName);
                    });
            }
        ),

        /**
         * Fetches a ReflectionClass for the class that declares this method.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.getdeclaringclass.php}
         */
        'getDeclaringClass': internals.typeInstanceMethod(
            ': ReflectionClass',
            function () {
                var classObject = this.getInternalProperty('class'),
                    className = classObject.getName();

                return globalNamespace.getClass('ReflectionClass', false)
                    .next(function (reflectionClassClass) {
                        return reflectionClassClass.instantiate([
                            valueFactory.createString(className)
                        ]);
                    });
            }
        ),

        /**
         * Fetches the name of this method.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.getname.php}
         */
        'getName': internals.typeInstanceMethod(
            ': string',
            function () {
                return valueFactory.createString(this.getInternalProperty('methodName'));
            }
        ),

        /**
         * Determines whether this method is abstract.
         * Note that built-in methods in PHPRuntime are never abstract.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.isabstract.php}
         */
        'isAbstract': internals.typeInstanceMethod(
            ': bool',
            function () {
                return valueFactory.createBoolean(false);
            }
        ),

        /**
         * Determines whether this method is final.
         * Note that built-in methods in PHPRuntime are never final.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.isfinal.php}
         */
        'isFinal': internals.typeInstanceMethod(
            ': bool',
            function () {
                return valueFactory.createBoolean(false);
            }
        ),

        /**
         * Determines whether this method is private.
         * Note that built-in methods in PHPRuntime do not expose visibility information,
         * so false is returned as the default.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.isprivate.php}
         */
        'isPrivate': internals.typeInstanceMethod(
            ': bool',
            function () {
                return valueFactory.createBoolean(false);
            }
        ),

        /**
         * Determines whether this method is protected.
         * Note that built-in methods in PHPRuntime do not expose visibility information,
         * so false is returned as the default.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.isprotected.php}
         */
        'isProtected': internals.typeInstanceMethod(
            ': bool',
            function () {
                return valueFactory.createBoolean(false);
            }
        ),

        /**
         * Determines whether this method is public.
         * Note that built-in methods in PHPRuntime do not expose visibility information,
         * so true is returned as the default.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.ispublic.php}
         */
        'isPublic': internals.typeInstanceMethod(
            ': bool',
            function () {
                return valueFactory.createBoolean(true);
            }
        ),

        /**
         * Determines whether this method is static.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionmethod.isstatic.php}
         */
        'isStatic': internals.typeInstanceMethod(
            ': bool',
            function () {
                return valueFactory.createBoolean(Boolean(this.getInternalProperty('callable').isStatic));
            }
        )
    });

    internals.disableAutoCoercion();

    return ReflectionMethod;
};
