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

describe('PHP "sizeof" builtin function integration (alias of count())', function () {
    it('should be able to count normal arrays and objects that implement the Countable interface', function () {
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

var_dump(sizeof($myArray));
var_dump(sizeof($myObject));
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile('/path/to/my_module.php', php),
            engine = module();

        engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
int(3)
int(1280)

EOS
*/;}) //jshint ignore:line
        );
    });
});
