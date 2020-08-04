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
    phpCommon = require('phpcommon');

module.exports = function (internals) {
    var callStack = internals.callStack,
        characterRegexCache = {}, // For caching the regexes used to do entity replacements, for speed
        hasOwn = {}.hasOwnProperty,
        valueFactory = internals.valueFactory,
        PHPError = phpCommon.PHPError,
        ENT_COMPAT = internals.getConstant('ENT_COMPAT'),
        ENT_HTML401 = internals.getConstant('ENT_HTML401'),
        ENT_NOQUOTES = internals.getConstant('ENT_NOQUOTES'),
        ENT_QUOTES = internals.getConstant('ENT_QUOTES'),
        HTML_ENTITIES = internals.getConstant('HTML_ENTITIES'),
        HTML_SPECIALCHARS = internals.getConstant('HTML_SPECIALCHARS'),
        TRANSLATION_TABLES = {
            HTML_ENTITIES: {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',

                '£': '&pound;' // TODO: Support adding remaining entities via addons
            },
            HTML_SPECIALCHARS: {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            }
        };

    /**
     * Fetches a translation table
     *
     * @param {string} functionName
     * @param {number} tableID
     * @param {number} flags
     * @param {string} encoding
     * @return {object}
     */
    function getTranslationTable(functionName, tableID, flags, encoding) {
        /*jshint bitwise: false */
        var quotesMode = 'double',
            tableData;

        switch (tableID) {
            case HTML_SPECIALCHARS:
                tableData = TRANSLATION_TABLES.HTML_SPECIALCHARS;
                break;
            case HTML_ENTITIES:
                tableData = TRANSLATION_TABLES.HTML_ENTITIES;
                break;
            default:
                throw new Error('Invalid table ID "' + tableID + '" given');
        }

        if ((flags & 3) === ENT_COMPAT) {
            quotesMode = 'double';
        } else if ((flags & 3) === ENT_QUOTES) {
            quotesMode = 'both';
        } else if ((flags & 3) === ENT_NOQUOTES) {
            quotesMode = 'none';
        }

        switch (quotesMode) {
            case 'double':
                tableData = Object.assign({}, tableData, { // Don't edit the original table object
                    '"': '&quot;'
                });
                break;
            case 'both':
                tableData = Object.assign({}, tableData, { // Don't edit the original table object
                    '"': '&quot;',
                    '\'': '&#039;'
                });
                break;
            default:
            case 'none':
            // Do nothing
        }

        if (encoding.toLowerCase() !== 'utf-8') {
            // Only UTF-8 is supported for now
            callStack.raiseError(
                PHPError.E_WARNING,
                functionName + '(): charset `' + encoding + '\' not supported, assuming utf-8'
            );
        }

        return tableData;
    }

    /**
     * Performs the actual HTML-encoding of a string using a given translation table
     *
     * @param {string} string String to encode
     * @param {object} translationTable Translation table (as returned from getTranslationTable())
     * @param {boolean} doubleEncode
     */
    function htmlEncode(string, translationTable, doubleEncode) {
        _.forOwn(translationTable, function (entityHTML, character) {
            var cacheKey = (doubleEncode ? '<double>' : '<single>') + character,
                pattern,
                regex;

            if (!hasOwn.call(characterRegexCache, cacheKey)) {
                pattern = '\\' + character;

                if (character === '&' && !doubleEncode) {
                    // Ensure we don't double-encode any entities in the two possible formats
                    // "&lt;" or "&#012"
                    pattern += '(?!\\w+;|#\\d+;)';
                }

                regex = new RegExp(pattern, 'g');

                characterRegexCache[cacheKey] = regex;
            } else {
                regex = characterRegexCache[cacheKey];
            }

            string = string.replace(regex, entityHTML);
        });

        return string;
    }

    return {
        /**
         * Fetches the translation table used by htmlspecialchars(...) or htmlentities(...)
         *
         * @see {@link https://secure.php.net/manual/en/function.get-html-translation-table.php}
         *
         * @param {IntegerValue|Reference|Variable} tableReference
         * @param {IntegerValue|Reference|Variable} flagsReference
         * @param {Reference|StringValue|Variable} encodingReference
         * @returns {ArrayValue}
         */
        'get_html_translation_table': function (tableReference, flagsReference, encodingReference) {
            /*jshint bitwise: false */
            var tableID = tableReference ?
                    tableReference.getValue().coerceToInteger().getNative() :
                    // Default to the htmlspecialchars(...) table
                    HTML_SPECIALCHARS,
                flags = flagsReference ?
                    flagsReference.getValue().coerceToInteger().getNative() :
                    ENT_COMPAT | ENT_HTML401,
                encoding = encodingReference ?
                    encodingReference.getValue().coerceToString().getNative() :
                    'UTF-8';

            return valueFactory.createArray(
                getTranslationTable('get_html_translation_table', tableID, flags, encoding)
            );
        },

        /**
         * Converts all applicable characters to HTML entities
         *
         * @see {@link https://secure.php.net/manual/en/function.htmlentities.php}
         *
         * @param {Reference|StringValue|Variable} stringReference
         * @param {IntegerValue|Reference|Variable} flagsReference
         * @param {Reference|StringValue|Variable} encodingReference
         * @param {BooleanValue|Reference|Variable} doubleEncodeReference
         * @returns {StringValue}
         */
        'htmlentities': function (stringReference, flagsReference, encodingReference, doubleEncodeReference) {
            /*jshint bitwise: false */
            var doubleEncode,
                string,
                flags,
                encoding,
                translationTable;

            if (arguments.length < 1) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'htmlentities() expects at least 1 parameter, ' + arguments.length + ' given'
                );
                return valueFactory.createNull();
            }

            doubleEncode = doubleEncodeReference ?
                doubleEncodeReference.getValue().coerceToBoolean().getNative() :
                true;
            string = stringReference.getValue().coerceToString().getNative();
            flags = flagsReference ?
                flagsReference.getValue().coerceToInteger().getNative() :
                ENT_COMPAT | ENT_HTML401;
            encoding = encodingReference ?
                encodingReference.getValue().coerceToString().getNative() :
                'UTF-8';
            translationTable = getTranslationTable(
                'htmlentities',
                HTML_ENTITIES,
                flags,
                encoding
            );

            string = htmlEncode(string, translationTable, doubleEncode);

            return valueFactory.createString(string);
        },

        /**
         * Converts all special characters to HTML entities
         *
         * @see {@link https://secure.php.net/manual/en/function.htmlspecialchars.php}
         *
         * @param {Reference|StringValue|Variable} stringReference
         * @param {IntegerValue|Reference|Variable} flagsReference
         * @param {Reference|StringValue|Variable} encodingReference
         * @param {BooleanValue|Reference|Variable} doubleEncodeReference
         * @returns {StringValue}
         */
        'htmlspecialchars': function (stringReference, flagsReference, encodingReference, doubleEncodeReference) {
            /*jshint bitwise: false */
            var doubleEncode,
                string,
                flags,
                encoding,
                translationTable;

            if (arguments.length < 1) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'htmlspecialchars() expects at least 1 parameter, ' + arguments.length + ' given'
                );
                return valueFactory.createNull();
            }

            doubleEncode = doubleEncodeReference ?
                doubleEncodeReference.getValue().coerceToBoolean().getNative() :
                true;
            string = stringReference.getValue().coerceToString().getNative();
            flags = flagsReference ?
                flagsReference.getValue().coerceToInteger().getNative() :
                ENT_COMPAT | ENT_HTML401;
            encoding = encodingReference ?
                encodingReference.getValue().coerceToString().getNative() :
                'UTF-8';
            translationTable = getTranslationTable(
                'htmlspecialchars',
                HTML_SPECIALCHARS,
                flags,
                encoding
            );

            string = htmlEncode(string, translationTable, doubleEncode);

            return valueFactory.createString(string);
        }
    };
};
