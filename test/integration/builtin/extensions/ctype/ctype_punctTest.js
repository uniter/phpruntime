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

describe('PHP "ctype_punct" builtin function integration', function () {
    it('should be able to check if all characters in a string are punctuation characters', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_punct('');
$result['all punctuation'] = ctype_punct('!@#$%^&*()');
$result['mixed with letters'] = ctype_punct('abc!');
$result['mixed with numbers'] = ctype_punct('123!');
$result['mixed with spaces'] = ctype_punct('! @');
$result['mixed with control chars'] = ctype_punct("!\n");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all punctuation': true,
            'mixed with letters': false,
            'mixed with numbers': false,
            'mixed with spaces': false,
            'mixed with control chars': false
        });
    });
});
