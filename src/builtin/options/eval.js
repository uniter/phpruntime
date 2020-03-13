/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpToAST = require('phptoast'),
    phpToJS = require('phptojs');

/**
 * PHP eval(...) support using PHPToAST and PHPToJS
 */
module.exports = function (internals) {
    var phpParser = phpToAST.create(null, {}),
        runtime = internals.runtime,
        phpParserState = phpParser.getState(),
        translator = internals.translator;

    // Provide the runtime's Translator service for use when generating any parsing-related errors
    phpParserState.setTranslator(translator);

    return {
        /**
         * Evaluates a PHP code string.
         * Note that this is a language construct and not a function.
         *
         * @see {@link https://secure.php.net/manual/en/function.eval.php}
         *
         * @param {string} evalPHP
         * @param {string} path
         * @param {object} promise
         */
        eval: function (evalPHP, path, promise) {
            var compiledModule,
                moduleWrapper,
                transpiledCode;

            phpParserState.setPath(path);

            transpiledCode = phpToJS.transpile(phpParser.parse(evalPHP), {
                bare: true,
                translator: translator
            });
            /*jshint evil: true */
            moduleWrapper = new Function(
                'return ' + transpiledCode
            )();
            compiledModule = runtime.compile(moduleWrapper);

            promise.resolve(compiledModule);
        }
    };
};
