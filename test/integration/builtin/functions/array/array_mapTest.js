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

describe('PHP "array_map" builtin function integration', function () {
    it('should be able to map one array to another', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$inputArray = [21, 27, 101];
$result[] = array_map(function ($item) {
    return $item * 2;
}, $inputArray);

$result[] = array_map('strtoupper', ['first', 'SEcond', 'thIRD']);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            [42, 54, 202], // Using a closure as the callback
            ['FIRST', 'SECOND', 'THIRD'] // Using a normal function as the callback
        ]);
    });
});
