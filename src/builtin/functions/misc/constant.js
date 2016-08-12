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
        globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Defines a new constant, optionally making it case-insensitive (in name)
         *
         * @see {@link https://secure.php.net/manual/en/function.define.php}
         *
         * @param {Value|Variable} nameValue
         * @param {Value|Variable} valueValue
         * @param {Value|Variable|undefined} isCaseInsensitive
         * @returns {IntegerValue}
         */
        'define': function (nameValue, valueValue, isCaseInsensitive) {
            var match,
                name,
                namespace,
                path;

            if (arguments.length === 0) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'define() expects at least 2 parameters, 0 given'
                );
                return valueFactory.createNull();
            }

            name = nameValue.getValue().getNative();
            isCaseInsensitive = isCaseInsensitive ? isCaseInsensitive.getValue().getNative() : false;
            valueValue = valueValue.getValue();

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
        },
        /**
         * Returns true if a constant is defined with the given name, false otherwise
         *
         * @see {@link https://secure.php.net/manual/en/function.defined.php}
         *
         * @param {Value|Variable} nameValue
         * @returns {BooleanValue}
         */
        'defined': function (nameValue) {
            var match,
                name,
                namespace,
                path;

            if (arguments.length === 0) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'defined() expects exactly 1 parameter, 0 given'
                );
                return valueFactory.createNull();
            }

            name = nameValue.getValue().getNative();

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
    };
};
