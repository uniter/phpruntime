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

describe('PHP "array_push" builtin function integration', function () {
    it('should be able to push one or more elements onto the end of an array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = ['first', 'two' => 'second', 'third'];

$result = [];
$result[] = array_push($myArray, 'fourth'); // Push a single new element on
$result[] = array_push($myArray, 'fifth', 'sixth'); // Push multiple elements on at once
$result[] = $myArray; // Check the eventual array value

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            4, // Return value should be the new no. of elements in the array
            6, // Same as above, after pushing a further two elements onto the array
            {
                0: 'first',
                two: 'second',
                1: 'third',
                2: 'fourth',
                3: 'fifth',
                4: 'sixth'
            } // Final array
        ]);
    });
});
