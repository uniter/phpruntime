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
    phpRuntime = require('../..'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    when = require('../when');

describe('PHP class autoload integration', function () {
    it('should correctly handle instantiating an asynchronously autoloaded class', function (done) {
        var module = new Function(
                'require',
                'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
                '(tools.valueFactory.createBarewordString("spl_autoload_register").call([' +
                'tools.createClosure(function () {var scope = tools.pushCall(this, currentClass).getScope();' +
                'try { tools.require(tools.valueFactory.createString("the_module.php").getNative());' +
                '} finally { tools.popCall(); }' +
                '}, scope' +
                ')], namespaceScope) || tools.valueFactory.createNull());' +
                'scope.getVariable("object").setValue(' +
                'tools.createInstance(namespaceScope, tools.valueFactory.createBarewordString("MyClass"), [])' +
                ');' +
                'return scope.getVariable("object").getValue().callMethod("getIt", []);' +
                'return tools.valueFactory.createNull();' +
                '});'
            )(function () {
                return phpRuntime;
            }),
            options = {
                include: function (path, promise) {
                    setTimeout(function () {
                        promise.resolve(nowdoc(function () {/*<<<EOS
<?php
class MyClass
{
    public function getIt()
    {
        return 22;
    }
}
EOS
*/;})); //jshint ignore:line
                    }, 10);
                }
            };

        module(options).execute().then(when(done, function (result) {
            expect(result.getNative()).to.equal(22);
        }), done);
    });

    it('should correctly handle reading a constant of an asynchronously autoloaded class', function (done) {
        var module = new Function(
                'require',
                'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
                '(tools.valueFactory.createBarewordString("spl_autoload_register").call([' +
                'tools.createClosure(function () {var scope = tools.pushCall(this, currentClass).getScope();' +
                'try { tools.require(tools.valueFactory.createString("the_module.php").getNative());' +
                '} finally { tools.popCall(); }' +
                '}, scope' +
                ')], namespaceScope) || tools.valueFactory.createNull());' +
                'scope.getVariable("object").setValue(' +
                'tools.createInstance(namespaceScope, tools.valueFactory.createBarewordString("MyClass"), [])' +
                ');' +
                'return tools.valueFactory.createBarewordString("MyClass").getConstantByName("MY_CONST", namespaceScope);' +
                'return tools.valueFactory.createNull();' +
                '});'
            )(function () {
                return phpRuntime;
            }),
            options = {
                include: function (path, promise) {
                    setTimeout(function () {
                        promise.resolve(nowdoc(function () {/*<<<EOS
<?php
class MyClass
{
    const MY_CONST = 21;
}
EOS
*/;})); //jshint ignore:line
                    }, 10);
                }
            };

        module(options).execute().then(when(done, function (result) {
            expect(result.getNative()).to.equal(21);
        }), done);
    });

    it('should correctly handle reading a constant from an interface implemented by an asynchronously autoloaded class', function (done) {
        var php = nowdoc(function () {/*<<<EOS
<?php
spl_autoload_register(function ($class) {
    require $class . '.php';
});

return MyClass::MY_CONST;
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return phpRuntime;
            }),
            options = {
                include: function (path, promise) {
                    setTimeout(function () {
                        if (path === 'MyClass.php') {
                            promise.resolve(nowdoc(function () {/*<<<EOS
<?php
class MyClass implements MyInterface
{
    const NOT_MY_CONST = 23;
}
EOS
*/;})); //jshint ignore:line
                        } else if (path === 'MyInterface.php') {
                            promise.resolve(nowdoc(function () {/*<<<EOS
<?php
interface MyInterface
{
    const MY_CONST = 21;
}
EOS
*/;})); //jshint ignore:line
                        } else {
                            promise.reject();
                        }
                    }, 10);
                }
            };

        module(options).execute().then(when(done, function (result) {
            expect(result.getNative()).to.equal(21);
        }), done);
    });
});
