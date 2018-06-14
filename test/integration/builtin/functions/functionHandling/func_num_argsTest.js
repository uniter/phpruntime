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

describe('PHP "func_num_args" builtin function integration', function () {
    it('should be able to fetch the number of both formal and informal arguments passed to a function', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// With two formal args
function add($num1, $num2) {
    global $result;

    $result[] = func_num_args();

    return $num1 + $num2;
}

// With no formal args
function doSomethingWithAllOfThese() {
    global $result;

    $result[] = func_num_args();

    return 'in doSomethingWithAllOfThese';
}

$result[] = add(10, 21);
$result[] = add(5, 17, 'this arg', 'and this one will be unused');
$result[] = doSomethingWithAllOfThese(4, 8, 100);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            2,
            10 + 21,
            4,
            5 + 17,
            3,
            'in doSomethingWithAllOfThese'
        ]);
    });
});
