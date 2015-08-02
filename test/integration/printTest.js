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
    phpRuntime = require('../..');

describe('PHP "print" expression integration', function () {
    it('should correctly handle a print of "hello"', function (done) {
        var module = new Function(
                'require',
                'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
                '(stdout.write(namespaceScope.getConstant("hello").coerceToString().getNative()), ' +
                'tools.valueFactory.createInteger(1));' +
                'return tools.valueFactory.createNull();' +
                '});'
            )(function () {
                return phpRuntime;
            }),
            engine = module(),
            stdoutResult = '';

        engine.getStdout().on('data', function (data) {
            stdoutResult += data;
        });

        engine.execute().then(function () {
            expect(stdoutResult).to.equal('hello');
            done();
        }, done).catch(done);
    });
});
