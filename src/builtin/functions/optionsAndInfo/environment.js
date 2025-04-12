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
    var readEnvironment = internals.getBinding('readEnvironment'),
        readEnvironmentVariable = internals.getBinding('readEnvironmentVariable'),
        valueFactory = internals.valueFactory,
        writeEnvironmentVariable = internals.getBinding('writeEnvironmentVariable');

    return {
        /**
         * Fetches the value of an environment variable.
         *
         * @see {@link https://secure.php.net/manual/en/function.getenv.php}
         */
        'getenv': internals.typeFunction(
            // TODO: Use `|false` instead of `|bool` once we have a literal boolean type.
            '?string $name = null, bool $local_only = false : string|array|bool',
            function (variableNameValue) {
                if (variableNameValue.getType() !== 'null') {
                    var value = readEnvironmentVariable(variableNameValue.getNative());

                    return valueFactory.coerce(value !== null ? value : false);
                }

                return valueFactory.createArray(readEnvironment());
            }
        ),

        /**
         * Sets the value of an environment variable.
         *
         * @see {@link https://secure.php.net/manual/en/function.putenv.php}
         */
        'putenv': internals.typeFunction(
            'string $assignment : bool',
            function (assignmentValue) {
                var assignment = assignmentValue.getNative(),
                    equalsIndex = assignment.indexOf('=');

                if (equalsIndex === -1) {
                    // If no equals sign, treat as removing the variable.
                    writeEnvironmentVariable(assignment, null);
                } else {
                    var name = assignment.substring(0, equalsIndex),
                        value = assignment.substring(equalsIndex + 1);

                    writeEnvironmentVariable(name, value);
                }

                return valueFactory.createBoolean(true);
            }
        )
    };
};
