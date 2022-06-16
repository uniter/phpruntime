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
    it('should be able to merge two indexed arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$firstArray = [20, 25];
$secondArray = [10, 11];

$result = array_merge($firstArray, $secondArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            20,
            25,
            10,
            11
        ]);
    });

    it('should be able to merge two associative arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$firstArray = ['first' => 20, 'second' => 25];
$secondArray = ['first' => 27, 'third' => 10, 'fourth' => 11];

$result = array_merge($firstArray, $secondArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'first': 27,  // Overridden by `first` element in second array
            'second': 25,
            'third': 10,
            'fourth': 11
        });
    });
});
