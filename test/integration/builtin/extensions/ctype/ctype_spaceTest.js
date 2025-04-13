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

describe('PHP "ctype_space" builtin function integration', function () {
    it('should be able to check if all characters in a string are whitespace characters', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_space('');
$result['all whitespace'] = ctype_space(" \t\n\r");
$result['mixed with letters'] = ctype_space("abc ");
$result['mixed with numbers'] = ctype_space("123 ");
$result['mixed with punctuation'] = ctype_space("! ");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all whitespace': true,
            'mixed with letters': false,
            'mixed with numbers': false,
            'mixed with punctuation': false
        });
    });
});
