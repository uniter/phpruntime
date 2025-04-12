/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var hasOwn = {}.hasOwnProperty;

/**
 * Environment variable handling bindings.
 */
module.exports = function (internals) {
    /**
     * Current environment variables.
     *
     * @type {Object.<string, string>}
     */
    var environment = internals.optionSet.getOption('env') || {};

    return {
        readEnvironment: function () {
            /**
             * Reads all current environment variables.
             *
             * @return {Object.<string, string>}
             */
            return function () {
                return environment;
            };
        },

        readEnvironmentVariable: function () {
            /**
             * Reads an environment variable.
             *
             * @param {string} name
             * @return {string|null}
             */
            return function (name) {
                return hasOwn.call(environment, name) ? String(environment[name]) : null;
            };
        },

        writeEnvironmentVariable: function () {
            /**
             * Writes an environment variable, deleting it if the value is null.
             *
             * @param {string} name
             * @param {string|null} value
             */
            return function (name, value) {
                if (value === null) {
                    delete environment[name];
                } else {
                    environment[name] = value;
                }
            };
        }
    };
};
