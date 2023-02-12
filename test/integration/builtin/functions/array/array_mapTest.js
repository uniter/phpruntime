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
    it('should be able to map one array to another', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$indexedArray = [21, 27, 101];
$result['with a closure'] = array_map(
    function ($item) {
        return $item * 2;
    },
    $indexedArray
);
$result['with a normal function'] = array_map('strtoupper', ['first', 'SEcond', 'thIRD']);

$associativeArray = ['first' => 'one', 'second' => 'two', 'third' => 'three'];
$result['associative array'] = array_map(
    function ($item) {
        return $item . ' [mapped]';
    },
    $associativeArray
);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            // Using a closure as the callback.
            'with a closure': [42, 54, 202],

            // Using a normal function as the callback.
            'with a normal function': ['FIRST', 'SECOND', 'THIRD'],

            'associative array': {
                'first': 'one [mapped]',
                'second': 'two [mapped]',
                'third': 'three [mapped]'
            }
        });
    });
});
