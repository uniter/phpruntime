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

describe('PHP "ctype_alpha" builtin function integration', function () {
    it('should be able to check if all characters in a string are alphabetic', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_alpha('');
$result['all letters'] = ctype_alpha('abc');
$result['all numbers'] = ctype_alpha('123');
$result['mixed alphanumeric'] = ctype_alpha('abc123');
$result['with spaces'] = ctype_alpha('abc def');
$result['with punctuation'] = ctype_alpha('abc!');
$result['with control chars'] = ctype_alpha("abc\n");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all letters': true,
            'all numbers': false,
            'mixed alphanumeric': false,
            'with spaces': false,
            'with punctuation': false,
            'with control chars': false
        });
    });
});
