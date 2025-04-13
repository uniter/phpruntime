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

describe('PHP "ctype_lower" builtin function integration', function () {
    it('should be able to check if all characters in a string are lowercase letters', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_lower('');
$result['all lowercase'] = ctype_lower('abc');
$result['mixed case'] = ctype_lower('abcDEF');
$result['all uppercase'] = ctype_lower('ABC');
$result['with numbers'] = ctype_lower('abc123');
$result['with spaces'] = ctype_lower('abc def');
$result['with punctuation'] = ctype_lower('abc!');
$result['with control chars'] = ctype_lower("abc\n");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all lowercase': true,
            'mixed case': false,
            'all uppercase': false,
            'with numbers': false,
            'with spaces': false,
            'with punctuation': false,
            'with control chars': false
        });
    });
});
