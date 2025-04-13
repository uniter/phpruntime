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

describe('PHP "ctype_xdigit" builtin function integration', function () {
    it('should be able to check if all characters in a string are hexadecimal digits', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_xdigit('');
$result['all hex digits'] = ctype_xdigit('123abc');
$result['all hex digits uppercase'] = ctype_xdigit('123ABC');
$result['mixed with non-hex'] = ctype_xdigit('123xyz');
$result['with spaces'] = ctype_xdigit('123 abc');
$result['with punctuation'] = ctype_xdigit('123abc!');
$result['with control chars'] = ctype_xdigit("123abc\n");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all hex digits': true,
            'all hex digits uppercase': true,
            'mixed with non-hex': false,
            'with spaces': false,
            'with punctuation': false,
            'with control chars': false
        });
    });
});
