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

describe('PHP "call_user_func_array" builtin function integration', function () {
    it('should be able to call a function with three arguments that returns a value', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
function sayHello($name, $age, $location)
{
    print 'Hi ' . $name . ' - ' . $age . ' from ' . $location . '!';

    return 'done';
}

return call_user_func_array('sayHello', ['Frank', 27, 'Cardiff, UK']);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.equal('done');
        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
Hi Frank - 27 from Cardiff, UK!
EOS
*/;}) //jshint ignore:line
        );
    });

    it('should be able to call a namespaced function when the second argument is passed by reference', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
namespace My\Awesome\Tools
{
    function doStuff($byVal, &$byRef)
    {
        $result = $byVal + 2;

        $byVal = 100; // Should be discarded
        $byRef = 42;

        return $result;
    }
}

namespace Some\Other\Place
{
    $myVar1 = 21;
    $myVar2 = 27;

    $result = [];

    $result[] = call_user_func_array('My\Awesome\Tools\doStuff', [$myVar1, &$myVar2]);
    $result[] = $myVar1;
    $result[] = $myVar2;

    return $result;
}
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            23, // $byVal + 2.
            21, // $myVar1 (unaffected).
            42  // $myVar2 (modified by-reference in doStuff(...)).
        ]);
    });
});
