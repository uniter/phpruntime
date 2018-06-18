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
    TYPE_SPECIFIER_TO_TYPE = {
        'b': 'binary',
        'c': 'ascii-character',
        'd': 'signed-decimal',
        'e': 'lower-exponent',
        'E': 'upper-exponent',
        'f': 'locale-aware-float',
        'F': 'locale-unaware-float',
        'g': 'lower-exponent-or-float',
        'G': 'upper-exponent-or-float',
        'o': 'octal',
        's': 'string',
        'u': 'unsigned-decimal',
        'x': 'lower-hexadecimal',
        'X': 'upper-hexadecimal'
    };

/**
 * Parses strings that use the format supported by the printf(...) family of functions
 *
 * @constructor
 */
function FormatParser() {
}

_.extend(FormatParser.prototype, {
    /**
     * Parses the provided format string to a list of directives
     *
     * @param {string} formatString
     * @returns {object[]}
     */
    parse: function (formatString) {
        var alignmentSpecifier,
            directives = [],
            explicitArgumentPosition,
            lastMatchEnd = 0,
            match,
            nextArgumentPosition = 0,
            regex = /%(?:(\d+)\$)?(\+)?(?:([ 0])|'(.))?(-)?(\d+)?(?:\.(\D)?(\d+))?([%bcdeEfFgGosuxX])/g,
            paddingCharacter,
            precisionSpecifier,
            showPositiveNumberSigns,
            typeSpecifier,
            widthSpecifier;

        while ((match = regex.exec(formatString)) !== null) {
            if (match[9] === '%') {
                continue;
            }

            if (lastMatchEnd < match.index) {
                directives.push({
                    kind: 'ordinary',
                    text: formatString.substring(lastMatchEnd, match.index)
                        // Resolve escapes back to a single literal "%" character
                        .replace(/%%/g, '%')
                });
            }

            explicitArgumentPosition = match[1] ? match[1] * 1 - 1 : null;

            // Sign specifier - prefix positive numbers with "+"
            // (by default only negatives are prefixed, with "-")
            showPositiveNumberSigns = !!match[2];

            // Padding character - 0 or a space, or another character if prefixed with a single quote
            paddingCharacter = match[3] || match[4] || ' ';

            // Whether to justify to the left or to the right (default is to the right)
            alignmentSpecifier = match[5] === '-' ? 'left': 'right';

            // The minimum no. of characters this conversion should result in
            // (using the padding character determined above)
            widthSpecifier = (match[6] || 0) * 1;

            if (match[7]) {
                // The character to use to pad a number may optionally be specified
                // between the period and the digit
                paddingCharacter = match[7];
            }

            // For a number this specifies how many decimal digits to display after the decimal point.
            // For a string this acts as a cutoff, specifying the maximum length it will be truncated to
            precisionSpecifier = (match[8] || 0) * 1;

            typeSpecifier = match[9];

            if (typeSpecifier === 's') {
                directives.push({
                    kind: 'conversion-specification',
                    argumentPosition: explicitArgumentPosition || nextArgumentPosition,
                    type: 'string'
                });
            } else {
                directives.push({
                    kind: 'conversion-specification',
                    argumentPosition: explicitArgumentPosition || nextArgumentPosition,
                    type: TYPE_SPECIFIER_TO_TYPE[typeSpecifier],
                    showPositiveSign: showPositiveNumberSigns,
                    paddingCharacter: paddingCharacter,
                    alignmentSpecifier: alignmentSpecifier,
                    widthSpecifier: widthSpecifier,
                    precisionSpecifier: precisionSpecifier
                });
            }

            if (explicitArgumentPosition === null) {
                nextArgumentPosition++;
            }

            lastMatchEnd = match.index + match[0].length;
        }

        if (lastMatchEnd < formatString.length) {
            directives.push({
                kind: 'ordinary',
                text: formatString.substr(lastMatchEnd)
                    // Resolve escapes back to a single literal "%" character
                    .replace(/%%/g, '%')
            });
        }

        return directives;
    }
});

module.exports = FormatParser;
