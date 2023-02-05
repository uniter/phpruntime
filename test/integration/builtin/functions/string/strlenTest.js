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

describe('PHP "strlen" builtin function integration', function () {
    it('should be able to measure the length of a string', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = strlen('');
$result['short string'] = strlen('abc def');
$result['longer string'] = strlen('abcdefghijklmnopqrstuvwxyz');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': 0,
            'short string': 7,
            'longer string': 26
        });
    });
});
