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
    INVALID_RANGE_MISSING_LEFT_CHAR = 'core.invalid_range_missing_left_char',
    INVALID_RANGE_MISSING_RIGHT_CHAR = 'core.invalid_range_missing_right_char',
    INVALID_RANGE_NOT_INCREMENTING = 'core.invalid_range_not_incrementing';

/**
 * Generates regex components for the trim() family of functions.
 *
 * @param {CallStack} callStack
 * @constructor
 */
function Trimmer(callStack) {
    /**
     * @type {CallStack}
     */
    this.callStack = callStack;
}

_.extend(Trimmer.prototype, {
    /**
     * Adds support for ".." in character masks of trim functions.
     *
     * @param {string} functionName
     * @param {string} characterMask
     */
    buildTrimCharacterClass: function (functionName, characterMask) {
        var trimmer = this;

        return characterMask.replace(
            /([\]\\-])|(^|[\s\S])\.\.([\s\S]|$)/g,
            function (all, specialChar, leftChar, rightChar) {
                if (specialChar) {
                    // Just escape special chars inside the character class.
                    return '\\' + specialChar;
                }

                if (leftChar === '') {
                    trimmer.callStack.raiseTranslatedError(
                        PHPError.E_WARNING,
                        INVALID_RANGE_MISSING_LEFT_CHAR,
                        {
                            func: functionName
                        }
                    );

                    return all; // Keep literal chars, including the dots as-is.
                }

                if (rightChar === '') {
                    trimmer.callStack.raiseTranslatedError(
                        PHPError.E_WARNING,
                        INVALID_RANGE_MISSING_RIGHT_CHAR,
                        {
                            func: functionName
                        }
                    );

                    return all; // Keep literal chars, including the dots as-is.
                }

                // Note that if the characters are identical, we allow it.
                if (leftChar.localeCompare(rightChar) === 1) {
                    trimmer.callStack.raiseTranslatedError(
                        PHPError.E_WARNING,
                        INVALID_RANGE_NOT_INCREMENTING,
                        {
                            func: functionName
                        }
                    );

                    return all; // Keep literal chars, including the dots as-is.
                }

                if (leftChar === '-') {
                    leftChar = '\\-';
                }

                if (rightChar === '-') {
                    rightChar = '\\-';
                }

                // Use regex character class "-" range.
                return leftChar + '-' + rightChar;
            }
        );
    }
});

module.exports = Trimmer;
