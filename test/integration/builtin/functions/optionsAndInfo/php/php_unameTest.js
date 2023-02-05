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
    tools = require('../../../../tools');

describe('PHP "php_uname" builtin function integration', function () {
    it('should return the correct string for each mode', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    'default (a)' => php_uname(),
    'a' => php_uname('a'),
    's' => php_uname('s'),
    'n' => php_uname('n'),
    'r' => php_uname('r'),
    'v' => php_uname('v'),
    'm' => php_uname('m')
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'default (a)': 'Uniter localhost 1.0.0 (Generic) JavaScript', // 'a' - All modes in the sequence "s n r v m".
            'a': 'Uniter localhost 1.0.0 (Generic) JavaScript', // As above, but explicitly.
            's': 'Uniter',    // 's' - Operating system name. eg. FreeBSD.
            'n': 'localhost', // 'n' - Host name. eg. localhost.example.com.
            'r': '1.0.0',     // 'r' - Release name. eg. 5.1.2-RELEASE.
            'v': '(Generic)', // 'v' - Version information. Varies a lot between operating systems.
            'm': 'JavaScript' // 'm' - Machine type. eg. i386.
        });
    });
});
