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

describe('PHP "array_shift" builtin function integration', function () {
    it('should remove and return the first element in the array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
// Numeric keys will be modified to start counting down from zero
$myFirstArray = [4 => 'first', 10 => 'second', 2 => 'third', 'fourth'];
// Literal keys will be left untouched
$mySecondArray = ['mine' => 'one', 'yours' => 'two', 'theirs' => 'three'];

$result[] = array_shift($myFirstArray);
$result[] = $myFirstArray;
$result[] = array_shift($mySecondArray);
$result[] = $mySecondArray;

// Internal pointer should be reset to the start of the array
$result[] = current($myFirstArray);

return $result;

EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'first', // Shifted element from first array.
            ['second', 'third', 'fourth'], // First (numerically indexed) array after shift.
            'one', // Shifted element from second array.
            {yours: 'two', theirs: 'three'}, // Second (associative) array after shift.
            'second' // Value of new first element of first array after shift.
        ]);
    });
});
