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
 * Processes a conversion specification supported by the printf(...) family of functions
 *
 * @constructor
 */
function FormatConverter() {
}

_.extend(FormatConverter.prototype, {
    /**
     * Processes a conversion specification, converting the specified value to a string
     *
     * @param {*} value
     * @param {object} directive
     * @returns {string}
     */
    convert: function (value, directive) {
        switch (directive.type) {
            case 'signed-decimal': // eg. "%d"
                /*jshint bitwise: false */
                value = value >> 0; // Cast to signed integer number

                if (directive.showPositiveSign && value > 0) {
                    value = '+' + value;
                }

                value += ''; // Cast to string

                // Alignment specifiers for printf(...) refer to which side the number should be on,
                // but .padStart(...) and .padEnd(...) refer to which side the _padding_ should be on (the opposite)
                // which is why these might seem reversed
                value = directive.alignmentSpecifier === 'right' ?
                    value.padStart(directive.widthSpecifier, directive.paddingCharacter) :
                    value.padEnd(directive.widthSpecifier, directive.paddingCharacter);

                return value;
            case 'string': // eg. "%s"
                return value;
            default:
                throw new Error('Unsupported conversion specification type "' + directive.type + '"');
        }
    }
});

module.exports = FormatConverter;
