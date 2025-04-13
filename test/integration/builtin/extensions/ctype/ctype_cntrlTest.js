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

describe('PHP "ctype_cntrl" builtin function integration', function () {
    it('should be able to check if all characters in a string are control characters', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_cntrl('');
$result['all control chars'] = ctype_cntrl("\n\r\t");
$result['mixed with letters'] = ctype_cntrl("abc\n");
$result['mixed with numbers'] = ctype_cntrl("123\n");
$result['mixed with spaces'] = ctype_cntrl(" \n");
$result['mixed with punctuation'] = ctype_cntrl("!\n");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all control chars': true,
            'mixed with letters': false,
            'mixed with numbers': false,
            'mixed with spaces': false,
            'mixed with punctuation': false
        });
    });
});
