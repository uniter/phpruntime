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

describe('PHP "array_replace" builtin function integration', function () {
    it('should be able to replace elements in indexed arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$firstArray = [1, 2, 3];
$secondArray = [1 => 'two', 3 => 'four'];
$thirdArray = [1 => 'TWO', 4 => 'five'];

$result['two arrays'] = array_replace($firstArray, $secondArray);
$result['three arrays'] = array_replace($firstArray, $secondArray, $thirdArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'two arrays': [
                1,
                'two',
                3,
                'four'
            ],
            'three arrays': [
                1,
                'TWO',
                3,
                'four',
                'five'
            ]
        });
    });

    it('should be able to replace elements in associative arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$firstArray = ['a' => 1, 'b' => 2, 'c' => 3];
$secondArray = ['b' => 'two', 'd' => 'four'];
$thirdArray = ['b' => 'TWO', 'e' => 'five'];

$result['two arrays'] = array_replace($firstArray, $secondArray);
$result['three arrays'] = array_replace($firstArray, $secondArray, $thirdArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'two arrays': {
                'a': 1,
                'b': 'two',
                'c': 3,
                'd': 'four'
            },
            'three arrays': {
                'a': 1,
                'b': 'TWO',
                'c': 3,
                'd': 'four',
                'e': 'five'
            }
        });
    });

    it('should handle empty arrays correctly', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$emptyArray = [];
$replacementArray = ['a' => 1, 'b' => 2];

$result['empty base'] = array_replace($emptyArray, $replacementArray);
$result['empty replacement'] = array_replace(['a' => 1], []);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty base': {
                'a': 1,
                'b': 2
            },
            'empty replacement': {
                'a': 1
            }
        });
    });
});
