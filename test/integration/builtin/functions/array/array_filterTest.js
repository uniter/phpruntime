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

describe('PHP "array_filter" builtin function integration', function () {
    it('should be able to filter an indexed array with a callback', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];
$myArray = ['one', 'two', 'ten'];

$result['before'] = $myArray;
$result['filtered'] = array_filter($myArray, function ($value) {
    return $value !== 'two';
});
$result['after'] = $myArray;

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module(),
            result = (await engine.execute()).getNative();

        expect(result).to.deep.equal({
            'before': ['one', 'two', 'ten'],
            // Note that keys are preserved, so once coerced to a native JavaScript array
            // its element with key 1 will be missing.
            'filtered': Object.assign([], {0: 'one', 2: 'ten'}),
            'after': ['one', 'two', 'ten'] // Original array should not be modified.
        });
    });

    it('should be able to filter an associative array with a callback', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];
$myArray = ['first' => 'one', 'second' => 'two', 'third' => 'ten'];

$result['before'] = $myArray;
$result['filtered'] = array_filter($myArray, function ($value) {
    return $value !== 'two';
});
$result['after'] = $myArray;

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module(),
            result = (await engine.execute()).getNative();

        expect(result).to.deep.equal({
            'before': {'first': 'one', 'second': 'two', 'third': 'ten'},
            'filtered': {'first': 'one', 'third': 'ten'},
            'after': {'first': 'one', 'second': 'two', 'third': 'ten'} // Original array should not be modified.
        });
    });
});
