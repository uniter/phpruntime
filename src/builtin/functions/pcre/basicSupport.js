/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

/*jshint bitwise: false */
'use strict';

var _ = require('microdash'),
    phpCommon = require('phpcommon'),
    FailureException = require('./Exception/FailureException'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    OffsetCapturingRegExp = require('regextend'),
    PHPError = phpCommon.PHPError;

/**
 * Basic-level PCRE support module. JavaScript's own RegExp implementation is used,
 * meaning that only the JavaScript-compliant subset of regular expression is supported.
 */
module.exports = function (internals) {
    var callStack = internals.callStack,
        valueFactory = internals.valueFactory,
        PREG_OFFSET_CAPTURE = internals.getConstant('PREG_OFFSET_CAPTURE'),
        PREG_PATTERN_ORDER = internals.getConstant('PREG_PATTERN_ORDER'),
        PREG_SET_ORDER = internals.getConstant('PREG_SET_ORDER');

    /**
     * Builds a native JavaScript RegExp where the given pattern is compatible. Note that PCRE
     * supports many features that JavaScript RegExps do not, which is handled in the
     * "Compilation failed" catch clause.
     *
     * @param {string} functionName
     * @param {string} originalPattern
     * @return {ExtendedRegExp}
     * @throws {FailureException}
     */
    function buildNativeRegex(functionName, originalPattern) {
        var invalidModifiers,
            modifiers,
            pattern,
            patternMatch = originalPattern.match(/^([\s\S])([\s\S]*)\1([\s\S]*)$/),
            regex;

        if (!patternMatch) {
            callStack.raiseError(
                PHPError.E_WARNING,
                functionName + '(): No ending delimiter \'' + originalPattern.charAt(0) + '\' found'
            );
            throw new FailureException();
        }

        pattern = patternMatch[2];
        modifiers = patternMatch[3];

        // Ignore the UTF-8 PCRE mode flag `/u`, as JavaScript natively supports Unicode strings
        //
        // NB: Can also be done with the (*UTF8) verb as part of the pattern,
        //     but we'll just support the recommended method via modifier for now
        modifiers = modifiers.replace(/u/g, '');

        invalidModifiers = modifiers.replace(/[Ais]/g, '');

        if (invalidModifiers !== '') {
            callStack.raiseError(
                PHPError.E_WARNING,
                // As per the reference implementation, only the first invalid modifier is mentioned
                functionName + '(): Unknown modifier \'' + invalidModifiers.charAt(0) + '\''
            );
            throw new FailureException();
        }

        // Support the implicit start-of-string anchor (sticky) modifier
        if (modifiers.indexOf('A') > -1) {
            modifiers = modifiers.replace(/A/g, 'y'); // Use ES6 "sticky" modifier "y"
        }

        // TODO: Shim `s` modifier for old browsers in the separate regextend lib instead
        if (modifiers.indexOf('s') > -1) {
            modifiers = modifiers.replace(/s/g, '');

            pattern = pattern.replace(/\.(?=(?:[^\[\]]|\[.*?\])*$)/g, '[\\s\\S]');
        }

        try {
            // Always append the global "g" flag, so that we can use the .lastIndex
            // property on the regex object to specify the start offset
            regex = new OffsetCapturingRegExp(pattern, modifiers + 'g');
        } catch (error) {
            callStack.raiseError(
                PHPError.E_WARNING,
                functionName + '(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"' + originalPattern + '" may be a valid but unsupported PCRE regex. JS RegExp error: ' + error
            );
            throw new FailureException();
        }

        return regex;
    }

    return {
        /**
         * Perform a single regular expression match
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-match.php}
         *
         * @param {Reference|Variable|Value} patternReference
         * @param {Reference|Variable|Value} subjectReference
         * @param {Reference|Variable|Value} matchesReference
         * @param {Reference|Variable|Value} flagsReference
         * @param {Reference|Variable|Value} offsetReference
         * @returns {IntegerValue|BooleanValue}
         */
        'preg_match': function (patternReference, subjectReference, matchesReference, flagsReference, offsetReference) {
            var flags,
                match,
                matched,
                offset = 0,
                pattern,
                patternValue,
                regex,
                subject,
                subjectValue;

            if (arguments.length < 2) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'preg_match() expects at least 2 parameters, ' + arguments.length + ' given'
                );
                return valueFactory.createBoolean(false);
            }

            // Use PREG_PATTERN_ORDER as the default flag
            flags = flagsReference ? flagsReference.coerceToInteger().getNative() : PREG_PATTERN_ORDER;

            if (flags & PREG_SET_ORDER) {
                // This flag is only supported by preg_match_all()
                callStack.raiseError(PHPError.E_WARNING, 'preg_match(): Invalid flags specified');
                return valueFactory.createBoolean(false);
            }

            if (offsetReference) {
                offset = offsetReference.getNative();
            }

            patternValue = patternReference.getValue();
            subjectValue = subjectReference.getValue();

            if (patternValue.getType() !== 'string') {
                throw new Error('preg_match(): Non-string pattern not yet supported');
            }

            if (subjectValue.getType() !== 'string') {
                throw new Error('preg_match(): Non-string subject not yet supported');
            }

            pattern = patternValue.getNative();
            subject = subjectValue.getNative();

            try {
                regex = buildNativeRegex('preg_match', pattern);
            } catch (error) {
                if (error instanceof FailureException) {
                    return valueFactory.createBoolean(false);
                }

                throw error;
            }

            // Start the match from the specified offset - we'll have appended the 'g'
            // flag even though this isn't a global match, so that `.lastIndex` will be respected
            regex.lastIndex = offset;

            if (matchesReference) {
                match = regex.exec(subject);

                if (match) {
                    match = flags & PREG_OFFSET_CAPTURE ?
                        // Offset capturing is enabled - record the offset at which each
                        // capturing group was matched alongside the substring
                        _.map(match, function (capturingGroup, capturingGroupIndex) {
                            return [
                                capturingGroup,
                                match.offsets[capturingGroupIndex]
                            ];
                        }) :
                        [].slice.call(match);
                } else {
                    match = [];
                }

                matchesReference.setValue(valueFactory.coerce(match));

                matched = match.length > 0;
            } else {
                matched = regex.test(subject);
            }

            return valueFactory.createInteger(matched ? 1 : 0);
        },

        /**
         * Perform a global regular expression match
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-match-all.php}
         *
         * @param {Variable|Value} patternReference
         * @param {Variable|Value} subjectReference
         * @param {Variable|Value} matchesReference
         * @param {Variable|Value} flagsReference
         * @param {Variable|Value} offsetReference
         * @returns {IntegerValue|BooleanValue}
         */
        'preg_match_all': function (patternReference, subjectReference, matchesReference, flagsReference, offsetReference) {
            var flags,
                match,
                matches = [],
                matchResult = [],
                offset = 0,
                offsetCaptureEnabled = false,
                matchOrder = 'pattern', // Use PREG_PATTERN_ORDER as the default flag
                pattern,
                patternValue,
                regex,
                subject,
                subjectValue;

            if (arguments.length < 2) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'preg_match_all() expects at least 2 parameters, ' + arguments.length + ' given'
                );
                return valueFactory.createBoolean(false);
            }

            if (flagsReference) {
                flags = flagsReference.getValue().coerceToInteger().getNative();

                if (flags & PREG_OFFSET_CAPTURE) {
                    offsetCaptureEnabled = true;
                    flags ^= PREG_OFFSET_CAPTURE;
                }

                if (flags & PREG_PATTERN_ORDER) {
                    matchOrder = 'pattern';

                    flags ^= PREG_PATTERN_ORDER; // Unset the relevant bits
                } else if (flags & PREG_SET_ORDER) {
                    matchOrder = 'set';

                    flags ^= PREG_SET_ORDER; // Unset the relevant bits
                }

                if (flags !== 0) {
                    callStack.raiseError(PHPError.E_WARNING, 'preg_match_all(): Invalid flags specified');
                    return valueFactory.createBoolean(false);
                }
            }

            if (offsetReference) {
                offset = offsetReference.getNative();
            }

            patternValue = patternReference.getValue();
            subjectValue = subjectReference.getValue();

            if (patternValue.getType() !== 'string') {
                throw new Error('preg_match_all(): Non-string pattern not yet supported');
            }

            if (subjectValue.getType() !== 'string') {
                throw new Error('preg_match_all(): Non-string subject not yet supported');
            }

            pattern = patternValue.getNative();
            subject = subjectValue.getNative();

            try {
                regex = buildNativeRegex('preg_match_all', pattern);
            } catch (error) {
                if (error instanceof FailureException) {
                    return valueFactory.createBoolean(false);
                }

                throw error;
            }

            // Start the match from the specified offset
            regex.lastIndex = offset;

            while ((match = regex.exec(subject)) !== null) {
                matches.push(match);
            }

            if (matchesReference) {
                _.each(matches, function (match, matchIndex) {
                    if (matchOrder === 'pattern') {
                        _.each(match, function (capturingGroup, capturingGroupIndex) {
                            if (matchResult.length <= capturingGroupIndex) {
                                matchResult[capturingGroupIndex] = [];
                            }

                            matchResult[capturingGroupIndex].push(
                                offsetCaptureEnabled ?
                                    // Offset capturing is enabled - record the offset at which each
                                    // capturing group was matched alongside the substring
                                    [
                                        capturingGroup,
                                        match.offsets[capturingGroupIndex]
                                    ] :
                                    capturingGroup
                            );
                        });
                    } else if (matchOrder === 'set') {
                        if (offsetCaptureEnabled) {
                            if (matchResult.length <= matchIndex) {
                                matchResult[matchIndex] = [];
                            }

                            _.each(match, function (capturingGroup, capturingGroupIndex) {
                                matchResult[matchIndex].push([
                                    capturingGroup,
                                    match.offsets[capturingGroupIndex]
                                ]);
                            });
                        } else {
                            matchResult.push([].slice.call(match));
                        }
                    } else {
                        throw new phpCommon.Exception('preg_match_all() :: Unexpected flags');
                    }
                });

                matchesReference.setValue(valueFactory.coerce(matchResult));
            }

            return valueFactory.createInteger(matches.length);
        },

        /**
         * Perform a regular expression find and replace
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-replace.php}
         *
         * @param {Reference|Variable|Value} patternReference
         * @param {Reference|Variable|Value} replacementReference
         * @param {Reference|Variable|Value} subjectReference
         * @param {Reference|Variable|Value} limitReference
         * @param {Reference|Variable|Value} countReference
         * @returns {ArrayValue|NullValue|StringValue}
         */
        'preg_replace': function (patternReference, replacementReference, subjectReference, limitReference, countReference) {
            var count = 0,
                limit = -1,
                patterns = [],
                patternValue,
                replacements = [],
                replacementValue,
                singleReplacement,
                singleSubject,
                subjects = [],
                subjectValue;

            if (arguments.length < 3) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'preg_replace() expects at least 3 parameters, 1 given'
                );
                return valueFactory.createNull();
            }

            patternValue = patternReference.getValue();
            replacementValue = replacementReference.getValue();
            subjectValue = subjectReference.getValue();

            if (patternValue.getType() === 'array') {
                _.each(patternValue.getValues(), function (patternValue) {
                    patterns.push(patternValue.getNative());
                });
            } else if (patternValue.getType() === 'string') {
                patterns.push(patternValue.getNative());
            } else {
                throw new Error('preg_replace(): Non-array/string pattern not yet supported'); // TODO: Coerce/raise PHP error
            }

            if (replacementValue.getType() === 'array') {
                _.each(replacementValue.getValues(), function (replacementValue) {
                    replacements.push(replacementValue.getNative());
                });
                singleReplacement = false;
            } else if (replacementValue.getType() === 'string') {
                replacements.push(replacementValue.getNative());
                singleReplacement = true;
            } else {
                throw new Error('preg_replace(): Non-array/string replacement not yet supported'); // TODO: Coerce/raise PHP error
            }

            if (limitReference) {
                limit = limitReference.getNative();
            }

            /**
             * Performs find/replace of all pattern & replacement pairs for one specific subject
             *
             * @param {string} subject
             * @return {string}
             */
            function replaceSubject(subject) {
                _.each(patterns, function (pattern, index) {
                    var countWithinPatternForSubject = 0,
                        regex,
                        replacement = singleReplacement ?
                            replacements[0] :
                            (index < replacements.length ? replacements[index] : '');

                    // May throw FailureExceptions
                    regex = buildNativeRegex('preg_replace', pattern);

                    if (countReference || limit > -1) {
                        // Caller wants to either record the total number of replacements done
                        // or limit the no. of replacements for each subject string
                        subject = regex.replace(subject, function (all) {
                            countWithinPatternForSubject++;

                            if (limit > -1 && countWithinPatternForSubject > limit) {
                                return all;
                            }

                            count++; // Only include replacements that were actually done in the count

                            return replacement;
                        });
                    } else {
                        subject = regex.replace(subject, replacement);
                    }
                });

                return subject;
            }

            try {
                if (subjectValue.getType() === 'array') {
                    singleSubject = false;

                    _.each(subjectValue.getKeys(), function (subjectKey) {
                        var subject = subjectValue.getElementByKey(subjectKey).getNative();

                        subjects.push(
                            new KeyValuePair(
                                subjectKey,
                                valueFactory.createString(replaceSubject(subject))
                            )
                        );
                    });
                } else if (subjectValue.getType() === 'string') {
                    singleSubject = true;
                    subjects[0] = valueFactory.createString(replaceSubject(subjectValue.getNative()));
                } else {
                    throw new Error('preg_replace(): Non-array/string subject not yet supported'); // TODO: Coerce/raise PHP error
                }
            } catch (error) {
                if (error instanceof FailureException) {
                    return valueFactory.createNull();
                }

                throw error;
            }

            if (countReference) {
                countReference.setValue(valueFactory.createInteger(count));
            }

            return singleSubject ? subjects[0] : valueFactory.createArray(subjects);
        }
    };
};
