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

describe('PHP "array_merge" builtin function integration', function () {
    it('should be able to merge indexed arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$firstArray = [20, 25];
$secondArray = [10, 11];
$thirdArray = [97, 98];

$result = [];

$result['two arrays'] = array_merge($firstArray, $secondArray);
$result['three arrays'] = array_merge($firstArray, $secondArray, $thirdArray);
$result['no arrays'] = array_merge();

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'two arrays': [
                20,
                25,
                10,
                11
            ],
            'three arrays': [
                20,
                25,
                10,
                11,
                97,
                98
            ],
            'no arrays': []
        });
    });

    it('should be able to merge associative arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$firstArray = ['first' => 20, 'second' => 25];
$secondArray = ['first' => 27, 'third' => 10, 'fourth' => 11];
$thirdArray = ['third' => 97, 'fifth' => 98, 'sixth' => 99];

$result = [];

$result['two arrays'] = array_merge($firstArray, $secondArray);
$result['three arrays'] = array_merge($firstArray, $secondArray, $thirdArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'two arrays': {
                'first': 27,  // Overridden by `first` element in second array.
                'second': 25,
                'third': 10,
                'fourth': 11
            },
            'three arrays': {
                'first': 27,  // Overridden by `first` element in second array.
                'second': 25,
                'third': 97,  // Overridden by `third` element in third array.
                'fourth': 11,
                'fifth': 98,
                'sixth': 99
            }
        });
    });
});
