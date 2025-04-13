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

describe('PHP "ctype_alnum" builtin function integration', function () {
    it('should be able to check if all characters in a string are alphanumeric', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_alnum('');
$result['all letters'] = ctype_alnum('abc');
$result['all numbers'] = ctype_alnum('123');
$result['mixed alphanumeric'] = ctype_alnum('abc123');
$result['with spaces'] = ctype_alnum('abc 123');
$result['with punctuation'] = ctype_alnum('abc123!');
$result['with control chars'] = ctype_alnum("abc123\n");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all letters': true,
            'all numbers': true,
            'mixed alphanumeric': true,
            'with spaces': false,
            'with punctuation': false,
            'with control chars': false
        });
    });
});
