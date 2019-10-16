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

describe('PHP "array_combine" builtin function integration', function () {
    it('should be able to combine a keys array and a values array into one associative result array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$keys = ['1st', '2nd', 21];
$values = ['first value', 'second value', 'indexed value'];

$result[] = array_combine($keys, $values);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            {
                '1st': 'first value',
                '2nd': 'second value',
                21: 'indexed value'
            }
        ]);
    });
});
