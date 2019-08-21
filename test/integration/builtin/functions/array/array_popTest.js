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

describe('PHP "array_pop" builtin function integration', function () {
    it('should be able to pop an element off of the end of an indexed array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = ['first', 'second', 'third'];

end($myArray); // Move to end so we can test internal array pointer handling

$result = [];
$result[] = array_pop($myArray);
$result[] = $myArray;
$result[] = current($myArray);
$result[] = array_pop($myArray);
$result[] = $myArray;
$result[] = array_pop($myArray);
$result[] = $myArray;
$result[] = array_pop($myArray);
$result[] = $myArray;

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'third',                // Last element is popped off first
            ['first', 'second'],    // Only the first two elements are left
            'first',                // [From current(...)] - Internal array pointer should be reset
            'second',               // Then, second element is popped off
            ['first'],              // No elements are left
            'first',                // Then, first element is popped off as it is now the last one
            [],                     // No elements are left
            null,                   // Array is empty, so NULL is returned as there is nothing to pop off
            []                      // Array is empty
        ]);
    });
});
