/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    tools = require('../../../tools');

describe('PHP "str_repeat" builtin function integration', function () {
    it('should be able to repeat strings', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['basic repetition'] = str_repeat('abc', 3);
$result['empty string'] = str_repeat('', 5);
$result['zero multiplier'] = str_repeat('abc', 0);
$result['negative multiplier'] = str_repeat('abc', -1);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'basic repetition': 'abcabcabc',
            'empty string': '',
            'zero multiplier': '',
            'negative multiplier': ''
        });
    });
});
