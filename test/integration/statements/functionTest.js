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
    phpRuntime = require('../../..');

describe('PHP "function" statement integration', function () {
    it('should return the expected result for a simple return statement', function (done) {
        var module = new Function(
            'require',
            'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
            'namespace.defineFunction("doNothing", function () {' +
            'var scope = tools.pushCall(this, currentClass).getScope(); ' +
            'try {  } finally { tools.popCall(); }' +
            '});' +
            'return (tools.valueFactory.createBarewordString("doNothing").call([], namespaceScope) || tools.valueFactory.createNull());' +
            'return tools.valueFactory.createNull();' +
            '});'
        )(function () {
            return phpRuntime;
        });

        module().execute().then(function (result) {
            expect(result.getNative()).to.equal(null);
            done();
        }, done).catch(done);
    });
});
