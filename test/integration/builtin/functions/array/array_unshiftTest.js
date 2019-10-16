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
    it('should be able to push one or more elements onto the beginning of an array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = ['first', 'second'];

$result = [];
$result[] = array_unshift($myArray, 'third'); // Unshift a single new element on
$result[] = array_unshift($myArray, 'fourth', 'fifth'); // Unshift multiple elements on at once
$result[] = $myArray; // Check the eventual array value

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            3, // Return value should be the new no. of elements in the array
            5, // Same as above, after pushing a further two elements onto the array
            ['fourth', 'fifth', 'third', 'first', 'second'] // Final array
        ]);
    });
});
