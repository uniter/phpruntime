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

describe('PHP environment reuse integration', function () {
    beforeEach(function () {
        this.require = function () {
            return phpRuntime;
        };
    });

    it('should correctly handle accessing a previously defined variable', function (done) {
        var environment = phpRuntime.createEnvironment(),
            module1 = new Function(
                'require',
                'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
                'scope.getVariable("num").setValue(tools.valueFactory.createInteger(21));' +
                'return tools.valueFactory.createNull();' +
                '});'
            )(this.require),
            module2 = new Function(
                'require',
                'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
                'return scope.getVariable("num").getValue().add(tools.valueFactory.createInteger(3));' +
                'return tools.valueFactory.createNull();' +
                '});'
            )(this.require);

        module1({}, environment).execute().then(function () {
            module2({}, environment).execute().then(function (result) {
                expect(result.getNative()).to.equal(24);
                done();
            }, done).catch(done);
        }, done).catch(done);
    });
});
