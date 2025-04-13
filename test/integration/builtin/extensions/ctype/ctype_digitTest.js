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

describe('PHP "ctype_digit" builtin function integration', function () {
    it('should be able to check if all characters in a string are decimal digits', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_digit('');
$result['all digits'] = ctype_digit('123');
$result['mixed with letters'] = ctype_digit('123abc');
$result['mixed with spaces'] = ctype_digit('123 456');
$result['mixed with punctuation'] = ctype_digit('123!');
$result['mixed with control chars'] = ctype_digit("123\n");
$result['hex digits'] = ctype_digit('123abc');
$result['decimal'] = ctype_digit('123.456');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all digits': true,
            'mixed with letters': false,
            'mixed with spaces': false,
            'mixed with punctuation': false,
            'mixed with control chars': false,
            'hex digits': false,
            'decimal': false
        });
    });
});
