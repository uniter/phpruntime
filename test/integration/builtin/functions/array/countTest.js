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
    phpCommon = require('phpcommon'),
    tools = require('../../../tools'),
    Exception = phpCommon.Exception;

describe('PHP "count" builtin function integration', function () {
    it('should be able to count normal arrays and objects that implement the Countable interface', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
class MyClass implements Countable
{
    public function count()
    {
        return 1280;
    }
}

$myArray = [21, 27, 'hello'];
$myObject = new MyClass();

$result = [];

$result['indexed array'] = count($myArray);
$result['object implementing Countable'] = count($myObject);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'indexed array': 3,
            'object implementing Countable': 1280
        });
    });

    it('should throw a meaningful error when COUNT_RECURSIVE is provided as mode', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = ['first' => 1, 'second' => 2];

count($myArray, COUNT_RECURSIVE);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            Exception,
            'count() :: Only COUNT_NORMAL (0) is supported, 1 given'
        );
    });
});
