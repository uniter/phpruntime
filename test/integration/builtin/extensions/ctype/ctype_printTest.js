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
    tools = require('../../../tools');

describe('PHP "ctype_print" builtin function integration', function () {
    it('should be able to check if all characters in a string are printable', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_print('');
$result['all printable'] = ctype_print('abc123!@#');
$result['with spaces'] = ctype_print('abc 123');
$result['with control chars'] = ctype_print("abc\n");
$result['with non-printable'] = ctype_print("abc\x00");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all printable': true,
            'with spaces': true,
            'with control chars': false,
            'with non-printable': false
        });
    });
});
