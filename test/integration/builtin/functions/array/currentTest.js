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

describe('PHP "current" builtin function integration', function () {
    it('should support both empty and populated arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myFirstArray = ['first', 21, 101];
$mySecondArray = [1 => 'one', 0 => 'zero']; // Order should be as defined, not numeric

next($myFirstArray); // Advance to the second element

$result['current of first array'] = current($myFirstArray);
$result['current of second array'] = current($mySecondArray);
$myUnrelatedArray = [];
$result['current of unrelated empty array'] = current($myUnrelatedArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'current of first array': 21,
            'current of second array': 'one',
            'current of unrelated empty array': false
        });
    });
});
