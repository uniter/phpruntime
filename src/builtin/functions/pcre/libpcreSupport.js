/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpCommon = require('phpcommon'),
    PCRE = require('pcre.js'),
    PHPError = phpCommon.PHPError;

/**
 * Full PCRE support module. libpcre is compiled from its original C
 * down to JavaScript using Emscripten using pcre.js: https://github.com/orzFly/pcre.js
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
                pcre,
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

            try {
                pcre = new PCRE(pattern, modifiers);
            } catch (error) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'preg_match(): Compilation failed. PCRE.js error: ' + error
                );
                return valueFactory.createBoolean(false);
            }

            match = pcre.match(subject, offset);
            matched = match !== null;

            if (matchesReference) {
                matchesReference.setValue(valueFactory.coerce(match ? [].slice.call(match) : []));
            }

            return valueFactory.createInteger(matched ? 1 : 0);
        }
    };
};
