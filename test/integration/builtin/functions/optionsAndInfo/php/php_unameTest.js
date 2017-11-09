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
    syncPHPRuntime = require('../../../../../../sync');

describe('PHP "php_uname" builtin function integration', function () {
    it('should return the correct string for each mode', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    php_uname(),
    php_uname('s'),
    php_uname('n'),
    php_uname('r'),
    php_uname('v'),
    php_uname('m')
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
            'Uniter localhost 1.0.0 (Generic) JavaScript', // 'a' - All modes in the sequence "s n r v m"
            'Uniter',    // 's' - Operating system name. eg. FreeBSD
            'localhost', // 'n' - Host name. eg. localhost.example.com
            '1.0.0',     // 'r' - Release name. eg. 5.1.2-RELEASE
            '(Generic)', // 'v' - Version information. Varies a lot between operating systems
            'JavaScript' // 'm' - Machine type. eg. i386
        ]);
    });
});
