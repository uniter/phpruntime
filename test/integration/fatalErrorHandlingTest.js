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
    phpRuntime = require('../..'),
    when = require('../when');

describe('Fatal error handling integration', function () {
    it('should output the correct message to stderr', function (done) {
        var module = new Function(
                'require',
                'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
                '(tools.valueFactory.createBarewordString("myFunc").call([], namespaceScope) || tools.valueFactory.createNull());' +
                'return tools.valueFactory.createNull();' +
                '});'
            )(function () {
                return phpRuntime;
            }),
            engine = module();

        engine.execute().catch(when(done, function () {
            expect(engine.getStderr().readAll()).to.equal('PHP Fatal error: Call to undefined function myFunc()');
        }));
    });
});
