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

describe('PHP "is_callable" builtin function integration', function () {
    it('should only return true for callable values', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

namespace My\Stuff {
    function myFunc() {}
}

namespace {
    function yourFunc() {}

    class MyClass {
        public function myInstanceMethod() {}

        public function myStaticMethod() {}
    }

    class MyInvokableClass {
        public function __invoke() {}
    }

    $myObject = new MyClass;
    $myInvokableObject = new MyInvokableClass();

    $result = [];

    $value = 'yourFunc';
    $result['function in global space'] = is_callable($value);

    $value = 'undefinedFunc';
    $result['undefined function in global space'] = is_callable($value);

    $value = 'My\Stuff\myFunc';
    $result['namespaced function'] = is_callable($value);

    $value = 'My\Stuff\undefinedFunc';
    $result['undefined namespaced function'] = is_callable($value);

    $value = function ($myParam) {};
    $result['closure'] = is_callable($value);

    $value = $myInvokableObject;
    $result['invokable object'] = is_callable($value);

    $value = new stdClass;
    $result['uninvokable object'] = is_callable($value);

    $value = 'MyClass::myStaticMethod';
    $result['static method via single string'] = is_callable($value);

    $value = 'MyClass::undefinedStaticMethod';
    $result['undefined static method of defined class via single string'] = is_callable($value);

    $value = 'UndefinedClass::aStaticMethod';
    $result['static method of undefined class via single string'] = is_callable($value);

    $value = ['MyClass', 'myStaticMethod'];
    $result['static method via array'] = is_callable($value);

    $value = ['MyClass', 'undefinedStaticMethod'];
    $result['undefined static method of defined class via array'] = is_callable($value);

    $value = ['UndefinedClass', 'aStaticMethod'];
    $result['static method of undefined class via array'] = is_callable($value);

    $value = [$myObject, 'myInstanceMethod'];
    $result['instance method via array'] = is_callable($value);

    $value = [$myObject, 'undefinedMethod'];
    $result['undefined instance method via array'] = is_callable($value);

    return $result;
}
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php);

        expect(module().execute().getNative()).to.deep.equal({
            'function in global space': true,
            'undefined function in global space': false,

            'namespaced function': true,
            'undefined namespaced function': false,

            'closure': true,
            'invokable object': true,
            'uninvokable object': false,

            'static method via single string': true,
            'undefined static method of defined class via single string': false,
            'static method of undefined class via single string': false,

            'static method via array': true,
            'undefined static method of defined class via array': false,
            'static method of undefined class via array': false,

            'instance method via array': true,
            'undefined instance method via array': false
        });
    });
});
