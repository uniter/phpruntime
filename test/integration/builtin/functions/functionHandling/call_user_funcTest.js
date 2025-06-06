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
    PHPFatalError = phpCommon.PHPFatalError;

describe('PHP "call_user_func" builtin function integration', function () {
    it('should be able to call a function with three arguments that returns a value', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
function sayHello($name, $age, $location)
{
    print 'Hi ' . $name . ' - ' . $age . ' from ' . $location . '!';

    return 'done';
}

return call_user_func('sayHello', 'Frank', 27, 'Cardiff, UK');
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

    it('should be able to call a wrapped JS function', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return call_user_func($doubleItWithJS, 21);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        engine.defineGlobal('doubleItWithJS', function (numberToDouble) {
            return numberToDouble * 2;
        });

        expect((await engine.execute()).getNative()).to.equal(42);
    });

    it('should not pass the arguments by reference', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
function myModifier(&$myArg)
{
    $myArg = 1007; // Attempt to modify, but `call_user_func` should only pass by value.
}

$myVar = 21;

call_user_func('myModifier', $myVar);

return $myVar;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        // Check the modification did not take effect.
        expect((await engine.execute()).getNative()).to.equal(21);
        expect(engine.getStderr().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
PHP Warning:  Parameter 1 to myModifier() expected to be a reference, value given in /path/to/my_module.php on line 9

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should add stack frames that participate correctly in traces', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
function myFuncThatIsCalledDynamically($myArg)
{
    return myFuncThatThrows();
}

function myFuncThatThrows()
{
    throw new Exception('Bang!');
}

$myVar = 'my string';

call_user_func('myFuncThatIsCalledDynamically', $myVar);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            PHPFatalError,
            'PHP Fatal error: Uncaught Exception: Bang! in /path/to/my_module.php on line 9'
        );
        expect(engine.getStderr().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
PHP Fatal error:  Uncaught Exception: Bang! in /path/to/my_module.php:9
Stack trace:
#0 /path/to/my_module.php(4): myFuncThatThrows()
#1 /path/to/my_module.php(14): myFuncThatIsCalledDynamically('my string')
#2 /path/to/my_module.php(14): call_user_func('myFuncThatIsCal...', 'my string')
#3 {main}
  thrown in /path/to/my_module.php on line 9

EOS
*/;}) //jshint ignore:line
        );
    });
});
