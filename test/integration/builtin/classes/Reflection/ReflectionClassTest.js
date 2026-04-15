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

describe('PHP "ReflectionClass" builtin class integration', function () {
    describe('->__construct()', function () {
        it('should accept a class name string', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');

return $reflection->getName();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.equal('LogicException');
        });

        it('should accept an object instance', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$exception = new LogicException('Oops');
$reflection = new ReflectionClass($exception);

return $reflection->getName();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.equal('LogicException');
        });
    });

    describe('->getEndLine()', function () {
        it('should return false as PHPCore does not track class end lines yet', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyClass {}
$reflection = new ReflectionClass('MyClass');

return $reflection->getEndLine();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.false;
        });
    });

    describe('->getFileName()', function () {
        it('should return the file path for a userland class defined in the same module', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyClass {}
$reflection = new ReflectionClass('MyClass');

return $reflection->getFileName();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.equal('/path/to/my_module.php');
        });

        it('should return the file path for a class defined in a different included module', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
require '/path/to/other_module.php';
$reflection = new ReflectionClass('MyOtherClass');

return $reflection->getFileName();
EOS
*/;}), //jshint ignore:line
                otherPhp = nowdoc(function () {/*<<<EOS
<?php
class MyOtherClass {}
EOS
*/;}), //jshint ignore:line
                environment = tools.createAsyncEnvironment({
                    include: function (path, promise) {
                        promise.resolve(tools.asyncTranspile(path, otherPhp));
                    }
                }),
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module({}, environment);

            expect((await engine.execute()).getNative()).to.equal('/path/to/other_module.php');
        });

        it('should return false for a built-in class', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');

return $reflection->getFileName();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.false;
        });
    });

    describe('->getInterfaceNames()', function () {
        it('should return the names of all implemented interfaces', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('SplQueue');

return $reflection->getInterfaceNames();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'Iterator',
                'Traversable',
                'Countable',
                'ArrayAccess',
                'Serializable'
            ]);
        });

        it('should return an empty array when the class implements no interfaces', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyPlainClass {}
$reflection = new ReflectionClass('MyPlainClass');

return $reflection->getInterfaceNames();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([]);
        });
    });

    describe('->getInterfaces()', function () {
        it('should return ReflectionClass objects keyed by interface name', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('SplQueue');
$interfaces = $reflection->getInterfaces();

return [
    'class' => $interfaces['Countable']::class,
    'name' => $interfaces['Countable']->getName()
];
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'class': 'ReflectionClass',
                'name': 'Countable'
            });
        });

        it('should return an empty array when the class implements no interfaces', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyPlainClass {}
$reflection = new ReflectionClass('MyPlainClass');

return $reflection->getInterfaces();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([]);
        });
    });

    describe('->getMethods()', function () {
        it('should return an array of ReflectionMethod objects', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyClass {
    public function myMethod() {}
    public function anotherMethod() {}
}
$reflection = new ReflectionClass('MyClass');
$methods = $reflection->getMethods();

return [
    'count' => count($methods),
    'methods' => array_map(function ($method) {
        return ['class' => $method::class, 'name' => $method->getName()];
    }, $methods)
];
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'count': 2,
                'methods': [
                    {'class': 'ReflectionMethod', 'name': 'myMethod'},
                    {'class': 'ReflectionMethod', 'name': 'anotherMethod'}
                ]
            });
        });
    });

    describe('->getName()', function () {
        it('should return the fully-qualified class name for both un-namespaced and namespaced classes', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
namespace My\Test;

class NamespacedClass {}

$result = [];

$result['un-namespaced'] = (new \ReflectionClass('LogicException'))->getName();
$result['namespaced'] = (new \ReflectionClass('My\Test\NamespacedClass'))->getName();

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'un-namespaced': 'LogicException',
                'namespaced': 'My\\Test\\NamespacedClass' // Note that namespace prefix is included.
            });
        });
    });

    describe('->getParentClass()', function () {
        it('should return a ReflectionClass for the parent class when one exists', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');
$parent = $reflection->getParentClass();

return [
    'parentClass' => $parent::class,
    'parentName' => $parent->getName()
];
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'parentClass': 'ReflectionClass',
                'parentName': 'Exception'
            });
        });

        it('should return false when the class has no parent', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyRootClass {}
$reflection = new ReflectionClass('MyRootClass');

return $reflection->getParentClass();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.false;
        });
    });

    describe('->getShortName()', function () {
        it('should return the un-qualified class name for both un-namespaced and namespaced classes', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
namespace My\Test;

class NamespacedClass {}

$result = [];

$result['un-namespaced'] = (new \ReflectionClass('LogicException'))->getShortName();
$result['namespaced'] = (new \ReflectionClass('My\Test\NamespacedClass'))->getShortName();

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'un-namespaced': 'LogicException',
                'namespaced': 'NamespacedClass' // Note that the namespace prefix is omitted.
            });
        });
    });

    describe('->getStartLine()', function () {
        it('should return false as PHPCore does not yet track class start lines', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyClass {}
$reflection = new ReflectionClass('MyClass');

return $reflection->getStartLine();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.false;
        });
    });

    describe('->hasMethod()', function () {
        it('should return true when the method exists', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');

return $reflection->hasMethod('getMessage');
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.true;
        });

        it('should return false when the method does not exist', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');

return $reflection->hasMethod('nonExistentMethod');
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.false;
        });
    });

    describe('->implementsInterface()', function () {
        it('should return true when the class implements the interface given by name', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('SplQueue');

return $reflection->implementsInterface('Countable');
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.true;
        });

        it('should return false when the class does not implement the interface given by name', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');

return $reflection->implementsInterface('Countable');
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.false;
        });

        it('should return true when given a ReflectionClass instance of an implemented interface', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$classReflection = new ReflectionClass('SplQueue');
$interfaceReflection = new ReflectionClass('Countable');

return $classReflection->implementsInterface($interfaceReflection);
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.true;
        });

        it('should return false when given a ReflectionClass instance of an un-implemented interface', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$classReflection = new ReflectionClass('LogicException');
$interfaceReflection = new ReflectionClass('ArrayAccess');

return $classReflection->implementsInterface($interfaceReflection);
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.be.false;
        });
    });

    describe('->newInstance()', function () {
        it('should create a new instance of the reflected class', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');
$instance = $reflection->newInstance('Test message');

return [
    'class' => $instance::class,
    'message' => $instance->getMessage()
];
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'class': 'LogicException',
                'message': 'Test message'
            });
        });
    });

    describe('->newInstanceArgs()', function () {
        it('should create a new instance of the reflected class using an args array', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$reflection = new ReflectionClass('LogicException');
$instance = $reflection->newInstanceArgs(['Test message']);

return [
    'class' => $instance::class,
    'message' => $instance->getMessage()
];
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'class': 'LogicException',
                'message': 'Test message'
            });
        });
    });

    describe('->newInstanceWithoutConstructor()', function () {
        it('should create a new instance without calling the constructor', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
class MyClass {
    public function __construct() {
        throw new Exception('Constructor was called unexpectedly');
    }

    public function greet() {
        return 'hello';
    }
}

$reflection = new ReflectionClass('MyClass');
$instance = $reflection->newInstanceWithoutConstructor();

return [
    'class' => $instance::class,
    'greeting' => $instance->greet()
];
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'class': 'MyClass',
                'greeting': 'hello'
            });
        });
    });
});
