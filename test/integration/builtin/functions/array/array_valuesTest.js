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

describe('PHP "array_values" builtin function integration', function () {
    it('should fetch only the values of an array, without sorting', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result[] = array_values([2 => 'two', '0' => 'zero', '1' => 'one']);
$result[] = array_values(['first' => 'value 1', 'second' => 'value 2']);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            ['two', 'zero', 'one'],
            ['value 1', 'value 2']
        ]);
    });
});
