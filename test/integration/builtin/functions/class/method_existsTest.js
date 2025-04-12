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

describe('PHP "method_exists" builtin function integration', function () {
    it('should support testing methods of objects', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
class MyClass
{
    public function myPublicMethod() {

    }

    private function myPrivateMethod() {

    }
}

$result = [];
$myObject = new MyClass;

$result['public method'] = method_exists($myObject, 'myPublicMethod');
$result['private method'] = method_exists($myObject, 'myPrivateMethod');
$result['undefined method'] = method_exists($myObject, 'myUndefinedMethod');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'public method': true,
            'private method': true,
            'undefined method': false
        });
    });

    it('should support autoloading classes', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
namespace My\Namespace
{
    spl_autoload_register(function ($className) {
        switch ($className) {
            case 'My\Namespace\MyClass':
                class MyClass {
                    public function myPublicMethod() {

                    }

                    private function myPrivateMethod() {

                    }
                }
                break;
            default:
                throw new \InvalidArgumentException('Invalid class in test: ' . $className);
        }
    });
}

namespace
{
    $result = [];
    $result['public method'] = method_exists('My\Namespace\MyClass', 'myPublicMethod');
    $result['private method'] = method_exists('My\Namespace\MyClass', 'myPrivateMethod');
    $result['undefined method'] = method_exists('My\Namespace\MyClass', 'myUndefinedMethod');

    return $result;
}
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'public method': true,
            'private method': true,
            'undefined method': false
        });
    });
});
