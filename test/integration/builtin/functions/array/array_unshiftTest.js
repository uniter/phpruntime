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

describe('PHP "array_unshift" builtin function integration', function () {
    it('should prepend one or more elements to the beginning of an array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
// Numeric keys will be re-indexed from zero; string keys are left untouched.
$myFirstArray = ['first', 'two' => 'second', 'third'];
$mySecondArray = ['mine' => 'one', 'yours' => 'two'];

$result[] = array_unshift($myFirstArray, 'zeroth'); // Unshift a single element.
$result[] = $myFirstArray;

$result[] = array_unshift($mySecondArray, 'alpha', 'beta'); // Unshift multiple elements.
$result[] = $mySecondArray;

return $result;

EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            4, // Return value: new length after unshifting one element.
            {
                0: 'zeroth',
                1: 'first',
                two: 'second',
                2: 'third'
            }, // First array after unshift (numeric keys re-indexed).
            4, // Return value: new length after unshifting two elements.
            {
                0: 'alpha',
                1: 'beta',
                mine: 'one',
                yours: 'two'
            } // Second array after unshift (string keys untouched).
        ]);
    });
});