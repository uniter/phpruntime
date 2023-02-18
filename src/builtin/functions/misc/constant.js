/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = function (internals) {
    var globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Defines a new constant, optionally making it case-insensitive (in name).
         *
         * @see {@link https://secure.php.net/manual/en/function.define.php}
         */
        'define': internals.typeFunction(
            'string $constant_name, mixed $value, bool $case_insensitive = false : bool',
            function (nameValue, valueValue, isCaseInsensitiveValue) {
                var match,
                    name = nameValue.getNative(),
                    isCaseInsensitive = isCaseInsensitiveValue.getNative(),
                    namespace,
                    path;

                name = name.replace(/^\//, '');
                match = name.match(/^(.*?)\\([^\\]+)$/);

                if (match) {
                    path = match[1];
                    name = match[2];
                    namespace = globalNamespace.getDescendant(path);
                } else {
                    namespace = globalNamespace;
                }

                namespace.defineConstant(name, valueValue, {
                    caseInsensitive: isCaseInsensitive
                });

                return valueFactory.createBoolean(true);
            }
        ),

        /**
         * Returns true if a constant is defined with the given name, false otherwise.
         *
         * @see {@link https://secure.php.net/manual/en/function.defined.php}
         */
        'defined': internals.typeFunction(
            'string $constant_name : bool',
            function (nameValue) {
                var match,
                    name = nameValue.getValue().getNative(),
                    namespace,
                    path;

                name = name.replace(/^\//, '');
                match = name.match(/^(.*?)\\([^\\]+)$/);

                if (match) {
                    path = match[1];
                    name = match[2];
                    namespace = globalNamespace.getDescendant(path);
                } else {
                    namespace = globalNamespace;
                }

                return valueFactory.createBoolean(namespace.hasConstant(name));
            }
        )
    };
};
