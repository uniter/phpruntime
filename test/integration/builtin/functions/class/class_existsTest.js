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

describe('PHP "class_exists" builtin function integration', function () {
    it('should support testing classes both with and without a namespace prefix', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
namespace My\Namespace
{
    class MyClass {}
}

namespace
{
    $result = [];
    $result['fqcn'] = class_exists('My\Namespace\MyClass');
    $result['missing_namespace'] = class_exists('MyClass');
    $result['undef'] = class_exists('AnUndefinedClass');
    var_dump($result);
}
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
array(3) {
  ["fqcn"]=>
  bool(true)
  ["missing_namespace"]=>
  bool(false)
  ["undef"]=>
  bool(false)
}

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should support autoloading classes', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
namespace My\Namespace
{
    spl_autoload_register(function ($className) {
        switch ($className) {
            case 'My\Namespace\MyClass':
                class MyClass {}
                break;
            default:
                throw new \InvalidArgumentException('Invalid class in test: ' . $className);
        }
    });
}

namespace
{
    $result = [];
    $result['before, with autoloading disabled'] = class_exists('My\Namespace\MyClass', false);
    $result['after autoloading'] = class_exists('My\Namespace\MyClass');

    return $result;
}
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'before, with autoloading disabled': false,
            'after autoloading': true
        });
    });
});
