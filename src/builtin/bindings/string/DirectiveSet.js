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
 * Represents the directives, either ordinary character sequences or conversion specifications,
 * parsed from a format string of the `printf(...)` family of functions by FormatParser.
 *
 * @param {Object[]} directives
 * @param {number} parameterCount
 * @constructor
 */
function DirectiveSet(directives, parameterCount) {
    /**
     * @type {Object[]}
     */
    this.directives = directives;
    /**
     * @type {number}
     */
    this.parameterCount = parameterCount;
}

_.extend(DirectiveSet.prototype, {
    /**
     * Fetches the directives.
     *
     * @returns {object[]}
     */
    getDirectives: function () {
        return this.directives;
    },

    /**
     * Fetches the number of parameters.
     *
     * Note that a conversion specification can optionally specify a specific argument position,
     * in which case it would not itself add to the parameter count.
     *
     * @returns {number}
     */
    getParameterCount: function () {
        return this.parameterCount;
    }
});

module.exports = DirectiveSet;
