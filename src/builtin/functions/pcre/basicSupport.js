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
         * @param {Variable|Value} patternReference
         * @param {Variable|Value} subjectReference
         * @param {Variable|Value} matchesReference
         * @param {Variable|Value} flagsReference
         * @param {Variable|Value} offsetReference
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
                throw new Error('preg_match() - flags arg not yet supported');
            }

            if (offsetReference) {
                offset = offsetReference.getValue().getNative();
            }

            patternValue = patternReference.getValue();
            pattern = patternValue.getNative();
            subjectValue = subjectReference.getValue();
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
            invalidModifiers = modifiers.replace(/[gi]/g, '');

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
        }
    };
};
