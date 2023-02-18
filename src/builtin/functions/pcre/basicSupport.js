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
    pcremu = require('pcremu').default,
    phpCommon = require('phpcommon'),
    replaceAll = require('core-js-pure/actual/string/replace-all'),
    FailureException = require('./Exception/FailureException'),
    KeyValuePair = require('phpcore/src/KeyValuePair'),
    PHPError = phpCommon.PHPError;

/**
 * PCRE support using the PCREmu library.
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
     * @return {Matcher}
     * @throws {FailureException}
     */
    function buildPcremuMatcher(functionName, originalPattern) {
        var delimiter,
            flags = {},
            invalidModifiers,
            matcher,
            modifiers,
            pattern,
            patternMatch = originalPattern.match(/^([\s\S])([\s\S]*)\1([\s\S]*)$/);

        if (!patternMatch) {
            callStack.raiseError(
                PHPError.E_WARNING,
                functionName + '(): No ending delimiter \'' + originalPattern.charAt(0) + '\' found'
            );
            throw new FailureException();
        }

        delimiter = patternMatch[1];
        pattern = patternMatch[2];
        modifiers = patternMatch[3];

        // Ignore the UTF-8 PCRE mode flag `/u`, as JavaScript natively supports Unicode strings
        //
        // NB: Can also be done with the (*UTF8) verb as part of the pattern,
        //     but we'll just support the recommended method via modifier for now
        modifiers = modifiers.replace(/u/g, '');

        // Note the "study" modifier "S" is allowed but ignored.
        invalidModifiers = modifiers.replace(/[AimSsx]/g, '');

        if (invalidModifiers !== '') {
            callStack.raiseError(
                PHPError.E_WARNING,
                // As per the reference implementation, only the first invalid modifier is mentioned
                functionName + '(): Unknown modifier \'' + invalidModifiers.charAt(0) + '\''
            );
            throw new FailureException();
        }

        // Unescape any escaped occurrences of the delimiter inside the pattern.
        pattern = replaceAll(pattern, '\\' + delimiter, delimiter);

        flags.anchored = modifiers.indexOf('A') > -1;
        flags.caseless = modifiers.indexOf('i') > -1;
        flags.multiline = modifiers.indexOf('m') > -1;
        flags.dotAll = modifiers.indexOf('s') > -1;
        flags.extended = modifiers.indexOf('x') > -1;

        try {
            matcher = pcremu.compile(pattern, flags);
        } catch (error) {
            callStack.raiseError(
                PHPError.E_WARNING,
                functionName + '(): Compilation failed [Uniter]: only basic-level preg support is enabled, ' +
                '"' + originalPattern + '" may be a valid but unsupported PCRE regex. PCREmu error: ' + error
            );
            throw new FailureException();
        }

        return matcher;
    }

    return {
        /**
         * Perform a single regular expression match.
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-match.php}
         *
         * @returns {IntegerValue|BooleanValue}
         */
        'preg_match': internals.typeFunction(
            'string $pattern, string $subject, array &$matches = null, int $flags = 0, int $offset = 0',
            function (patternValue, subjectValue, matchesSnapshot, flagsValue, offsetValue) {
                // FIXME: Add union return type above once supported.

                var flags = flagsValue.getNative(),
                    match,
                    matcher,
                    offset,
                    pattern,
                    pcremuMatch,
                    subject;

                // Use PREG_PATTERN_ORDER as the default flag.
                if (flags === 0) {
                    flags = PREG_PATTERN_ORDER;
                }

                if (flags & PREG_SET_ORDER) {
                    // This flag is only supported by preg_match_all().
                    callStack.raiseError(PHPError.E_WARNING, 'preg_match(): Invalid flags specified');
                    return valueFactory.createBoolean(false);
                }

                offset = offsetValue.getNative();

                pattern = patternValue.getNative();
                subject = subjectValue.getNative();

                try {
                    matcher = buildPcremuMatcher('preg_match', pattern);
                } catch (error) {
                    if (error instanceof FailureException) {
                        return valueFactory.createBoolean(false);
                    }

                    throw error;
                }

                pcremuMatch = matcher.matchOne(subject, offset);

                if (matchesSnapshot.isReferenceable()) {
                    // $matches was provided so let's store the matches as requested.
                    if (pcremuMatch) {
                        match = [];

                        _.each(matcher.getCapturingGroupNames(), function (name) {
                            var isNumberedCapture = typeof name === 'number',
                                capture = isNumberedCapture ?
                                    pcremuMatch.getNumberedCapture(name) :
                                    pcremuMatch.getNamedCapture(name);

                            match[name] = flags & PREG_OFFSET_CAPTURE ?
                                [
                                    capture,
                                    // Offset capturing is enabled - record the offset at which each
                                    // capturing group was matched alongside the substring.
                                    isNumberedCapture ?
                                        pcremuMatch.getNumberedCaptureStart(name) :
                                        pcremuMatch.getNamedCaptureStart(name)
                                ] :
                                capture;
                        });
                    } else {
                        match = [];
                    }

                    matchesSnapshot.setValue(valueFactory.coerce(match));
                }

                return valueFactory.createInteger(pcremuMatch !== null ? 1 : 0);
            }
        ),

        /**
         * Perform a global regular expression match.
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-match-all.php}
         */
        'preg_match_all': internals.typeFunction(
            'string $pattern, string $subject, array &$matches = null, int $flags = 0, int $offset = 0',
            function (patternValue, subjectValue, matchesSnapshot, flagsValue, offsetReference) {
                // FIXME: Add union "|false" return type above once supported.

                var flags = flagsValue.getNative(),
                    matchResult = [],
                    offset = 0,
                    offsetCaptureEnabled = false,
                    matchOrder = 'pattern', // Use PREG_PATTERN_ORDER as the default flag.
                    matcher,
                    pattern,
                    pcremuMatches,
                    subject;

                if (flags & PREG_OFFSET_CAPTURE) {
                    offsetCaptureEnabled = true;
                    flags ^= PREG_OFFSET_CAPTURE;
                }

                if (flags & PREG_PATTERN_ORDER) {
                    matchOrder = 'pattern';

                    flags ^= PREG_PATTERN_ORDER; // Unset the relevant bits.
                } else if (flags & PREG_SET_ORDER) {
                    matchOrder = 'set';

                    flags ^= PREG_SET_ORDER; // Unset the relevant bits.
                }

                if (flags !== 0) {
                    callStack.raiseError(PHPError.E_WARNING, 'preg_match_all(): Invalid flags specified');
                    return valueFactory.createBoolean(false);
                }

                if (offsetReference) {
                    offset = offsetReference.getNative();
                }

                pattern = patternValue.getNative();
                subject = subjectValue.getNative();

                try {
                    matcher = buildPcremuMatcher('preg_match_all', pattern);
                } catch (error) {
                    if (error instanceof FailureException) {
                        return valueFactory.createBoolean(false);
                    }

                    throw error;
                }

                pcremuMatches = matcher.matchAll(subject, offset);

                if (matchesSnapshot.isReferenceable()) {
                    _.each(pcremuMatches, function (pcremuMatch, matchIndex) {
                        if (matchOrder === 'pattern') {
                            _.each(matcher.getCapturingGroupNames(), function (name) {
                                var isNumberedCapture = typeof name === 'number',
                                    capture = isNumberedCapture ?
                                        pcremuMatch.getNumberedCapture(name) :
                                        pcremuMatch.getNamedCapture(name);

                                if (!matchResult[name]) {
                                    matchResult[name] = [];
                                }

                                matchResult[name].push(
                                    offsetCaptureEnabled ?
                                        // Offset capturing is enabled - record the offset at which each
                                        // capturing group was matched alongside the substring.
                                        [
                                            capture,
                                            isNumberedCapture ?
                                                pcremuMatch.getNumberedCaptureStart(name) :
                                                pcremuMatch.getNamedCaptureStart(name)
                                        ] :
                                        capture
                                );
                            });
                        } else if (matchOrder === 'set') {
                            if (matchResult.length <= matchIndex) {
                                matchResult[matchIndex] = [];
                            }

                            _.each(matcher.getCapturingGroupNames(), function (name) {
                                var isNumberedCapture = typeof name === 'number',
                                    capture = isNumberedCapture ?
                                        pcremuMatch.getNumberedCapture(name) :
                                        pcremuMatch.getNamedCapture(name);

                                matchResult[matchIndex][name] = offsetCaptureEnabled ?
                                    [
                                        capture,
                                        isNumberedCapture ?
                                            pcremuMatch.getNumberedCaptureStart(name) :
                                            pcremuMatch.getNamedCaptureStart(name)
                                    ] :
                                    capture;
                            });
                        } else {
                            throw new phpCommon.Exception('preg_match_all() :: Unexpected flags');
                        }
                    });

                    matchesSnapshot.setValue(valueFactory.coerce(matchResult));
                }

                return valueFactory.createInteger(pcremuMatches.length);
            }
        ),

        /**
         * Perform a find and replace using one or more regular expressions.
         *
         * @see {@link https://secure.php.net/manual/en/function.preg-replace.php}
         */
        'preg_replace': internals.typeFunction(
            'string|array $pattern, string|array $replacement, ' +
            'string|array $subject, int $limit = -1, int &$count = null : string|array|null',
            function (patternValue, replacementValue, subjectValue, limitValue, countSnapshot) {
                var count = 0,
                    limit = limitValue.getNative(),
                    patterns = [],
                    replacements = [],
                    singleReplacement,
                    singleSubject,
                    subjects = [];

                if (patternValue.getType() === 'array') {
                    _.each(patternValue.getValues(), function (patternValue) {
                        patterns.push(patternValue.getNative());
                    });
                } else if (patternValue.getType() === 'string') {
                    patterns.push(patternValue.getNative());
                }

                if (replacementValue.getType() === 'array') {
                    _.each(replacementValue.getValues(), function (replacementValue) {
                        replacements.push(replacementValue.getNative());
                    });
                    singleReplacement = false;
                } else if (replacementValue.getType() === 'string') {
                    replacements.push(replacementValue.getNative());
                    singleReplacement = true;
                }

                /**
                 * Performs find/replace of all pattern & replacement pairs for one specific subject.
                 *
                 * @param {string} subject
                 * @return {string}
                 */
                function replaceSubject(subject) {
                    _.each(patterns, function (pattern, index) {
                        var patternAttemptIndex = 0,
                            leftString,
                            matcher,
                            offset = 0,
                            pcremuMatch,
                            replacement = singleReplacement ?
                                replacements[0] :
                                (index < replacements.length ? replacements[index] : '');

                        // May throw FailureExceptions.
                        matcher = buildPcremuMatcher('preg_replace', pattern);

                        // Ensure we only make the max. number of replacements for the pattern.
                        while (limit === -1 || patternAttemptIndex < limit) {
                            pcremuMatch = matcher.matchOne(subject, offset);

                            if (pcremuMatch === null) {
                                break; // No more matches.
                            }

                            // Extract the portion of subject up to the beginning of this match.
                            leftString = subject.substring(0, pcremuMatch.getStart());

                            // Perform this replacement inside the subject.
                            subject = leftString + replacement + subject.substring(pcremuMatch.getEnd());

                            // Position the next match attempt just after the end of this replacement.
                            offset = leftString.length + replacement.length;

                            patternAttemptIndex++;

                            // Only include replacements that were actually done in the count.
                            // Note that this tracks all replacements made across all patterns.
                            count++;
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
                    }
                } catch (error) {
                    if (error instanceof FailureException) {
                        return valueFactory.createNull();
                    }

                    throw error;
                }

                if (countSnapshot.isReferenceable()) {
                    // A reference was provided for $count, so write it back.
                    countSnapshot.setValue(valueFactory.createInteger(count));
                }

                return singleSubject ? subjects[0] : valueFactory.createArray(subjects);
            }
        )
    };
};
