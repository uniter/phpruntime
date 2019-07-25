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
    FailureException = require('./Exception/FailureException'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    PHPError = phpCommon.PHPError;

/**
 * Basic-level PCRE support module. JavaScript's own RegExp implementation is used,
 * meaning that only the JavaScript-compliant subset of regular expression is supported.
 *
 *
 */
module.exports = function (internals) {
    var callStack = internals.callStack,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Perform a regular expression match
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
            var invalidModifiers,
                match,
                matched,
                modifiers,
                offset = 0,
                pattern,
                patternMatch,
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

            if (flagsReference && flagsReference.getValue().getNative() !== 0) {
                throw new Error('preg_match(): flags arg not yet supported');
            }

            if (offsetReference) {
                offset = offsetReference.getValue().getNative();
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

            patternMatch = pattern.match(/^([\s\S])([\s\S]*)\1([\s\S]*)$/);

            if (!patternMatch) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'preg_match(): No ending delimiter \'' + pattern.charAt(0) + '\' found'
                );
                return valueFactory.createBoolean(false);
            }

            pattern = patternMatch[2];
            modifiers = patternMatch[3];
            invalidModifiers = modifiers.replace(/[i]/g, '');

            if (invalidModifiers !== '') {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    // As per the reference implementation, only the first invalid modifier is mentioned
                    'preg_match(): Unknown modifier \'' + invalidModifiers.charAt(0) + '\''
                );
                return valueFactory.createBoolean(false);
            }

            if (offset > 0) {
                // Apply the start offset using a prefix regex,
                // remembering that dot won't always match newlines
                pattern = '(^[\\s\\S]{' + offset + ',})' + pattern;

                // Increment all backreferences to account for the extra capturing group we just added
                pattern = pattern.replace(/\\(\d\d?)/, function (all, number) {
                    return '\\' + (number * 1 + 1);
                });
            }

            try {
                regex = new RegExp(pattern, modifiers);
            } catch (error) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'preg_match(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                    'this may be a valid but unsupported PCRE regex. JS RegExp error: ' + error
                );
                return valueFactory.createBoolean(false);
            }

            if (matchesReference) {
                match = subject.match(regex);

                if (match) {
                    match = [].slice.call(match);

                    if (offset > 0) {
                        // Strip the offset prefix from the complete match
                        match[0] = match[0].substr(match[1].length);
                        match.splice(1, 1); // Remove the offset prefix match from the result
                    }
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
                invalidModifiers,
                limit = -1,
                modifiers,
                patterns = [],
                patternMatch,
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

                    patternMatch = pattern.match(/^([\s\S])([\s\S]*)\1([\s\S]*)$/);

                    if (!patternMatch) {
                        callStack.raiseError(
                            PHPError.E_WARNING,
                            'preg_replace(): No ending delimiter \'' + pattern.charAt(0) + '\' found'
                        );
                        throw new FailureException(valueFactory.createNull());
                    }

                    pattern = patternMatch[2];
                    modifiers = patternMatch[3];
                    invalidModifiers = modifiers.replace(/[i]/g, '');

                    if (invalidModifiers !== '') {
                        callStack.raiseError(
                            PHPError.E_WARNING,
                            // As per the reference implementation, only the first invalid modifier is mentioned
                            'preg_replace(): Unknown modifier \'' + invalidModifiers.charAt(0) + '\''
                        );
                        throw new FailureException(valueFactory.createNull());
                    }

                    // For preg_replace, the match is implicitly always global
                    modifiers += 'g';

                    try {
                        regex = new RegExp(pattern, modifiers);
                    } catch (error) {
                        callStack.raiseError(
                            PHPError.E_WARNING,
                            'preg_replace(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                            'this may be a valid but unsupported PCRE regex. JS RegExp error: ' + error
                        );
                        throw new FailureException(valueFactory.createNull());
                    }

                    if (countReference || limit > -1) {
                        // Caller wants to either record the total number of replacements done
                        // or limit the no. of replacements for each subject string
                        subject = subject.replace(regex, function (all) {
                            countWithinPatternForSubject++;

                            if (limit > -1 && countWithinPatternForSubject > limit) {
                                return all;
                            }

                            count++; // Only include replacements that were actually done in the count

                            return replacement;
                        });
                    } else {
                        subject = subject.replace(regex, replacement);
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
                    return error.getReturnValue();
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
