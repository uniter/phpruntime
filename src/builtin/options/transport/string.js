/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var INCLUDE_OPTION = 'include',
    phpCommon = require('phpcommon'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    Exception = phpCommon.Exception;

/**
 * Support for returning a PHP code string from an include transport
 */
module.exports = function (internals) {
    var initialInclude = internals.optionSet.getOption(INCLUDE_OPTION),
        phpParser = phpToAST.create(null, {}),
        runtime = internals.runtime,
        phpParserState = phpParser.getState(),
        translator = internals.translator;

    // Provide the runtime's Translator service for use when generating any parsing-related errors
    phpParserState.setTranslator(translator);

    /**
     * Parses and transpiles the given PHP source as fetched from the given path,
     * compiling it into a PHPCore Engine factory function ready to be returned
     * back to PHPCore's Loader mechanism.
     *
     * @param {string} php
     * @param {string} path
     * @returns {Function}
     */
    function transpile(php, path) {
        var compiledModule,
            moduleWrapper,
            transpiledCode;

        phpParserState.setPath(path);

        transpiledCode = phpToJS.transpile(phpParser.parse(php), {
            bare: true,
            translator: translator
        });
        /*jshint evil: true */
        moduleWrapper = new Function(
            'return ' + transpiledCode
        )();
        compiledModule = runtime.compile(moduleWrapper);

        return compiledModule;
    }

    return {
        /**
         * Specifies the transport to use when including or requiring PHP modules.
         *
         * @param {string} path
         * @param {Promise} promise
         * @param {string} callerPath
         * @param {ValueFactory} valueFactory
         */
        include: function (path, promise, callerPath, valueFactory) {
            var subPromise = {
                reject: promise.reject,
                resolve: function (result) {
                    // Support include transports that return PHP code strings
                    // by transpiling them before passing back to the core
                    if (typeof result === 'string') {
                        promise.resolve(transpile(result, path));
                        return;
                    }

                    promise.resolve(result);
                }
            };

            if (!initialInclude) {
                throw new Exception(
                    'load(' + path + ') :: No "' +
                    INCLUDE_OPTION +
                    '" transport option is available for loading the module'
                );
            }

            initialInclude(path, subPromise, callerPath, valueFactory);
        }
    };
};
