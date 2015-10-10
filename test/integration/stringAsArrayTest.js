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
    phpRuntime = require('../..'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    when = require('../when');

describe('PHP string-as-array integration', function () {
    it('should correctly handle reading a character of a string', function (done) {
        var php = nowdoc(function () {/*<<<EOS
<?php
return 'my string'[1];
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return phpRuntime;
            });

        module().execute().then(when(done, function (result) {
            expect(result.getNative()).to.equal('y');
        }), done);
    });
});
