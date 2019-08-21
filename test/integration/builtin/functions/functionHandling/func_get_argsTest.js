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

describe('PHP "func_get_args" builtin function integration', function () {
    it('should be able to fetch three arguments passed to a function with no formal ones', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
function doubleAll()
{
    $result = [];

    foreach (func_get_args() as $arg) {
        $result[] = $arg * 2;
    }

    return $result;
}

return doubleAll(10, 26, 200);
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([20, 52, 400]);
    });

    it('should be able to fetch three arguments passed to a function with two formal ones', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
function doubleAll($first, $second)
{
    $result = [$first, $second, 'and then'];

    foreach (func_get_args() as $arg) {
        $result[] = $arg * 2;
    }

    return $result;
}

return doubleAll(10, 26, 200);
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal(
            [10, 26, 'and then', 20, 52, 400]
        );
    });
});
