/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    syncPHPRuntime = require('../../../../sync');

describe('PHP error handling constants integration', function () {
    it('should support all the error handling constants', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    E_ERROR,
    E_WARNING,
    E_PARSE,
    E_NOTICE,
    E_CORE_ERROR,
    E_CORE_WARNING,
    E_COMPILE_ERROR,
    E_COMPILE_WARNING,
    E_USER_ERROR,
    E_USER_WARNING,
    E_USER_NOTICE,
    E_STRICT,
    E_RECOVERABLE_ERROR,
    E_DEPRECATED,
    E_USER_DEPRECATED,
    E_ALL
];
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            1,      // E_ERROR,
            2,      // E_WARNING,
            4,      // E_PARSE,
            8,      // E_NOTICE,
            16,     // E_CORE_ERROR,
            32,     // E_CORE_WARNING,
            64,     // E_COMPILE_ERROR,
            128,    // E_COMPILE_WARNING,
            256,    // E_USER_ERROR,
            512,    // E_USER_WARNING,
            1024,   // E_USER_NOTICE,
            2048,   // E_STRICT,
            4096,   // E_RECOVERABLE_ERROR,
            8192,   // E_DEPRECATED,
            16384,  // E_USER_DEPRECATED,
            32767   // E_ALL
        ]);
    });
});
