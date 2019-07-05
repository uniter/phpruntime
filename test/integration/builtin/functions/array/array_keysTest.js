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

describe('PHP "array_keys" builtin function integration', function () {
    it('should be able to fetch all keys defined by an array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = [
    'my numerically indexed value',
    'my_element' => 'my value',
    'my_null_element' => null,
    'my second numerically indexed value'
];

return array_keys($myArray);
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            0,
            'my_element',
            'my_null_element',
            1 // Even when there are some assoc. elements in between, indexing is separate
        ]);
    });
});
