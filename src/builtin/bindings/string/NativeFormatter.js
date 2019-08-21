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
    Exception = phpCommon.Exception,
    MissingFormatArgumentException = require('./Exception/MissingFormatArgumentException');

/**
 * Formats a string according to the format supported by the printf(...) family of functions
 *
 * @param {FormatParser} formatParser
 * @param {FormatConverter} formatConverter
 * @constructor
 */
function NativeFormatter(formatParser, formatConverter) {
    /**
     * @type {FormatConverter}
     */
    this.formatConverter = formatConverter;
    /**
     * @type {FormatParser}
     */
    this.formatParser = formatParser;
}

_.extend(NativeFormatter.prototype, {
    /**
     * Builds and returns the provided format string populated with the given arguments
     *
     * @param {string} formatString
     * @param {array} args
     * @returns {string}
     */
    format: function (formatString, args) {
        var formatter = this,
            directives = formatter.formatParser.parse(formatString);

        args = args || [];

        return directives
            .map(function (directive) {
                var arg;

                if (directive.kind === 'ordinary') {
                    // Plain text - just output as it was in the format string
                    return directive.text;
                }

                if (directive.kind === 'conversion-specification') {
                    // Conversion specifications are the placeholders "%s", "%d" etc.

                    if (directive.argumentPosition >= args.length) {
                        throw new MissingFormatArgumentException(directive.argumentPosition);
                    }

                    arg = args[directive.argumentPosition];

                    // Perform the conversion
                    return formatter.formatConverter.convert(arg, directive);
                }

                throw new Exception('Unsupported directive kind "' + directive.kind + '"');
            })
            .join('');
    }
});

module.exports = NativeFormatter;
