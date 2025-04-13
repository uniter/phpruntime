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

describe('PHP "ctype_upper" builtin function integration', function () {
    it('should be able to check if all characters in a string are uppercase letters', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_upper('');
$result['all uppercase'] = ctype_upper('ABC');
$result['mixed case'] = ctype_upper('ABCdef');
$result['all lowercase'] = ctype_upper('abc');
$result['with numbers'] = ctype_upper('ABC123');
$result['with spaces'] = ctype_upper('ABC DEF');
$result['with punctuation'] = ctype_upper('ABC!');
$result['with control chars'] = ctype_upper("ABC\n");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all uppercase': true,
            'mixed case': false,
            'all lowercase': false,
            'with numbers': false,
            'with spaces': false,
            'with punctuation': false,
            'with control chars': false
        });
    });
});
