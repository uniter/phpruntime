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

describe('PHP runtime constants integration', function () {
    it('should support all the PHP constants', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    PHP_OS,
    PHP_SAPI,
    PHP_VERSION,
    PHP_VERSION_ID
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
            'Uniter',  // PHP_OS
            'cli',     // PHP_SAPI
            '5.4.0',   // PHP_VERSION
            50400      // PHP_VERSION_ID
        ]);
    });
});
