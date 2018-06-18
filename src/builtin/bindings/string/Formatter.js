/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

/**
 * Formats a string according to the format supported by the printf(...) family of functions
 *
 * @param {NativeFormatter} nativeFormatter
 * @constructor
 */
function Formatter(nativeFormatter) {
    /**
     * @type {NativeFormatter}
     */
    this.nativeFormatter = nativeFormatter;
}

_.extend(Formatter.prototype, {
    /**
     * Builds and returns the provided format string populated with the given arguments
     *
     * @param {string} formatString
     * @param {Reference[]|Value[]|Variable[]} argReferences
     * @returns {string}
     */
    format: function (formatString, argReferences) {
        var argNatives = argReferences.map(function (argReference) {
            var argValue = argReference.getValue();

            if (argValue.getType() === 'object' || argValue.getType() === 'array') {
                argValue = argValue.coerceToString();
            }

            return argValue.getNative();
        });

        return this.nativeFormatter.format(formatString, argNatives);
    }
});

module.exports = Formatter;
