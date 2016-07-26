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
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    syncPHPRuntime = require('../../../../../sync');

describe('PHP "call_user_func" builtin function integration', function () {
    it('should be able to call a function with three arguments that returns a value', function () {
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
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            engine = module();

        expect(engine.execute().getNative()).to.equal('done');
        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
Hi Frank - 27 from Cardiff, UK!
EOS
*/;}) //jshint ignore:line
        );
    });

    it('should not pass the arguments by reference', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
function myModifier(&$myArg)
{
    $myArg = 1007; // Attempt to modify, but `call_user_func` should only pass by value
}

$myVar = 21;

call_user_func('myModifier', $myVar);

return $myVar;
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            engine = module();

        expect(engine.execute().getNative()).to.equal(21);
        expect(engine.getStderr().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
PHP Warning: Parameter 1 to myModifier() expected to be a reference, value given

EOS
*/;}) //jshint ignore:line
        );
    });
});