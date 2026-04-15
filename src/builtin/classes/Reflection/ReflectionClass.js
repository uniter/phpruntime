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
    KeyValuePair = require('phpcore/src/KeyValuePair');

module.exports = function (internals) {
    var flow = internals.flow,
        globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    /**
     * Creates a new ReflectionClass instance wrapping the given class.
     *
     * @param {string} className
     * @returns {ChainableInterface<ObjectValue>}
     */
    function createReflectionClassForName(className) {
        return globalNamespace.getClass('ReflectionClass', false)
            .next(function (reflectionClassClass) {
                return reflectionClassClass.instantiate([
                    valueFactory.createString(className)
                ]);
            });
    }

    /**
     * Collects all interface Class objects recursively from the given class and its ancestors.
     *
     * @param {Class} classObject
     * @param {Object} seen Map of seen interface names (mutated in place)
     * @param {Class[]} objects Ordered list of Class objects (mutated in place)
     */
    function collectInterfaceObjects(classObject, seen, objects) {
        var superClass = classObject.getSuperClass();

        classObject.getInterfaces().forEach(function (iface) {
            var name = iface.getName();

            if (!seen[name]) {
                seen[name] = true;
                objects.push(iface);
                collectInterfaceObjects(iface, seen, objects);
            }
        });

        if (superClass) {
            collectInterfaceObjects(superClass, seen, objects);
        }
    }

    /**
     * Provides reflection information about a class.
     *
     * @see {@link https://secure.php.net/manual/en/class.reflectionclass.php}
     * @constructor
     */
    function ReflectionClass() {
        // Internal state is set in __construct.
    }

    _.extend(ReflectionClass.prototype, {
        /**
         * Constructs a ReflectionClass for the given class name or object.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.construct.php}
         */
        '__construct': internals.typeInstanceMethod(
            'mixed $objectOrClass : void',
            function (objectOrClassValue) {
                var reflectionValue = this,
                    className;

                if (objectOrClassValue.getType() === 'object') {
                    className = objectOrClassValue.getClassName();
                } else {
                    className = objectOrClassValue.getNative();
                }

                return globalNamespace.getClass(className)
                    .next(function (classObject) {
                        reflectionValue.setInternalProperty('class', classObject);
                    });
            }
        ),

        /**
         * Fetches the names of all interfaces this class implements.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getinterfacenames.php}
         */
        'getInterfaceNames': internals.typeInstanceMethod(
            ': array',
            function () {
                var classObject = this.getInternalProperty('class'),
                    objects = [],
                    seen = {};

                collectInterfaceObjects(classObject, seen, objects);

                return valueFactory.createArray(objects.map(function (iface) {
                    return valueFactory.createString(iface.getName());
                }));
            }
        ),

        /**
         * Fetches all interfaces this class implements as an associative array
         * of interface name to ReflectionClass.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getinterfaces.php}
         */
        'getInterfaces': internals.typeInstanceMethod(
            ': array',
            function () {
                var classObject = this.getInternalProperty('class'),
                    objects = [],
                    seen = {},
                    pairs = [];

                collectInterfaceObjects(classObject, seen, objects);

                if (objects.length === 0) {
                    return valueFactory.createArray([]);
                }

                return flow.eachAsync(objects, function (iface) {
                    var name = iface.getName();

                    return createReflectionClassForName(name)
                        .next(function (reflClass) {
                            pairs.push(new KeyValuePair(
                                valueFactory.createString(name),
                                reflClass
                            ));
                        });
                }).next(function () {
                    return valueFactory.createArray(pairs);
                });
            }
        ),

        /**
         * Fetches all methods of this class as an array of ReflectionMethod objects.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getmethods.php}
         */
        'getMethods': internals.typeInstanceMethod(
            '?int $filter = null : array',
            function (filterValue) {
                var classObject = this.getInternalProperty('class'),
                    methodCallables = classObject.getMethodCallables(),
                    methodNames = Object.keys(methodCallables),
                    filterInt = filterValue.getType() !== 'null' ? filterValue.getNative() : null,
                    filteredNames,
                    results = [];

                // When no filter is given, return all methods.
                // Otherwise, include methods matching any of the specified flag bits.
                if (filterInt !== null) {
                    filteredNames = methodNames.filter(function (name) {
                        var callable = methodCallables[name],
                            isStatic = Boolean(callable.isStatic),
                            // ReflectionMethod::IS_PUBLIC = 1, IS_STATIC = 16.
                            matchesPublic = Math.floor(filterInt / 1) % 2 === 1,
                            matchesStatic = Math.floor(filterInt / 16) % 2 === 1;

                        // Public: all built-in methods are treated as public.
                        if (matchesPublic) {
                            return true;
                        }

                        // Static: include only if the method is static.
                        if (matchesStatic && isStatic) {
                            return true;
                        }

                        return false;
                    });
                } else {
                    filteredNames = methodNames;
                }

                return globalNamespace.getClass('ReflectionMethod', false)
                    .next(function (reflectionMethodClass) {
                        return flow.eachAsync(filteredNames, function (methodName) {
                            return reflectionMethodClass.instantiate([
                                valueFactory.createString(classObject.getName()),
                                valueFactory.createString(methodName)
                            ]).next(function (reflectionMethodValue) {
                                results.push(reflectionMethodValue);
                            });
                        });
                    })
                    .next(function () {
                        return valueFactory.createArray(results);
                    });
            }
        ),

        /**
         * Fetches the ending line number of the class definition, or false for built-in classes.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getendline.php}
         */
        'getEndLine': internals.typeInstanceMethod(
            ': mixed',
            function () {
                // PHPCore does not yet track end line numbers for class definitions.
                return valueFactory.createBoolean(false);
            }
        ),

        /**
         * Fetches the filename of the file where the class is defined,
         * or false for built-in/internal classes.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getfilename.php}
         */
        'getFileName': internals.typeInstanceMethod(
            ': mixed',
            function () {
                var classObject = this.getInternalProperty('class'),
                    filePath = classObject.namespaceScope.getFilePath();

                if (filePath === null) {
                    return valueFactory.createBoolean(false);
                }

                return valueFactory.createString(filePath);
            }
        ),

        /**
         * Fetches the fully-qualified class name (FQCN).
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getname.php}
         */
        'getName': internals.typeInstanceMethod(
            ': string',
            function () {
                return valueFactory.createString(this.getInternalProperty('class').getName());
            }
        ),

        /**
         * Fetches the parent class, or false if there is none.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getparentclass.php}
         */
        'getParentClass': internals.typeInstanceMethod(
            ': mixed', // TODO: Fix return type when `|false` is supported.
            function () {
                var classObject = this.getInternalProperty('class'),
                    superClass = classObject.getSuperClass();

                if (!superClass) {
                    return valueFactory.createBoolean(false);
                }

                return createReflectionClassForName(superClass.getName());
            }
        ),

        /**
         * Fetches the short (unqualified) class name, without any namespace prefix.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getshortname.php}
         */
        'getShortName': internals.typeInstanceMethod(
            ': string',
            function () {
                return valueFactory.createString(this.getInternalProperty('class').getUnprefixedName());
            }
        ),

        /**
         * Fetches the starting line number of the class definition, or false for built-in classes.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.getstartline.php}
         */
        'getStartLine': internals.typeInstanceMethod(
            ': mixed',
            function () {
                // PHPCore does not yet track start line numbers for class definitions.
                return valueFactory.createBoolean(false);
            }
        ),

        /**
         * Determines whether this class has the given method defined (including inherited methods).
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.hasmethod.php}
         */
        'hasMethod': internals.typeInstanceMethod(
            'string $name : bool',
            function (nameValue) {
                var classObject = this.getInternalProperty('class'),
                    methodName = nameValue.getNative(),
                    currentClass = classObject;

                // Traverse the class hierarchy to find the method.
                while (currentClass) {
                    if (currentClass.getMethodCallable(methodName) !== null) {
                        return valueFactory.createBoolean(true);
                    }

                    currentClass = currentClass.getSuperClass();
                }

                return valueFactory.createBoolean(false);
            }
        ),

        /**
         * Determines whether this class implements the given interface.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.implementsinterface.php}
         */
        'implementsInterface': internals.typeInstanceMethod(
            'ReflectionClass|string $interface : bool',
            function (interfaceValue) {
                var classObject = this.getInternalProperty('class'),
                    interfaceName;

                if (interfaceValue.getType() === 'object') {
                    // Assume it is a ReflectionClass instance; access internal state directly.
                    interfaceName = interfaceValue.getInternalProperty('class').getName();
                } else {
                    interfaceName = interfaceValue.getNative();
                }

                return valueFactory.createBoolean(classObject.is(interfaceName));
            }
        ),

        /**
         * Creates a new instance of the reflected class using the given constructor arguments.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.newinstance.php}
         */
        'newInstance': internals.typeInstanceMethod(
            'mixed ...$args : object',
            function (argsValue) {
                return this.getInternalProperty('class').instantiate(argsValue.getValues());
            }
        ),

        /**
         * Creates a new instance of the reflected class using the given array of constructor arguments.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.newinstanceargs.php}
         */
        'newInstanceArgs': internals.typeInstanceMethod(
            'array $args : object',
            function (argsValue) {
                return this.getInternalProperty('class').instantiate(argsValue.getValues());
            }
        ),

        /**
         * Creates a new instance of the reflected class without invoking its constructor.
         *
         * @see {@link https://secure.php.net/manual/en/reflectionclass.newinstancewithoutconstructor.php}
         */
        'newInstanceWithoutConstructor': internals.typeInstanceMethod(
            ': object',
            function () {
                var classObject = this.getInternalProperty('class');

                return classObject.initialiseConstants()
                    .next(function () {
                        return classObject.initialiseStaticProperties();
                    })
                    .next(function () {
                        return classObject.initialiseInstancePropertyDefaults();
                    })
                    .next(function () {
                        return classObject.instantiateBare();
                    });
            }
        )
    });

    internals.disableAutoCoercion();

    return ReflectionClass;
};
