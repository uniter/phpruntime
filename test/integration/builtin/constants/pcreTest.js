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

describe('PHP PCRE constants integration', function () {
    it('should support all the PCRE constants', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    PREG_OFFSET_CAPTURE
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
            256 // PREG_OFFSET_CAPTURE
        ]);
    });
});
