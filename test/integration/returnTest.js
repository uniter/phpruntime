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

describe('PHP "return" statement integration', function () {
    it('should return the expected result for a simple return statement', function (done) {
        var module = new Function(
            'require',
            'return require(\'phpruntime\')(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
            'return tools.valueFactory.createInteger(4);' +
            'return tools.valueFactory.createNull();' +
            '});'
        )(function () {
            return phpRuntime;
        });

        module().execute().then(function (result) {
            expect(result.getNative()).to.equal(4);
            done();
        }, done).catch(done);
    });
});
