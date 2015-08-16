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

describe('PHP "include" statement integration', function () {
    it('should correctly handle an include where the loader returns a PHP code string', function (done) {
        var module = new Function(
            'require',
            'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
            'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
            'scope.getVariable("num").setValue(tools.include(tools.valueFactory.createString("abc.php").getNative()));' +
            'return scope.getVariable("num").getValue();' +
            'return tools.valueFactory.createNull();' +
            '});'
        )(function () {
            return phpRuntime;
        }),
            options = {
                include: function (path, promise) {
                    promise.resolve('<?php return 22;');
                }
            };

        module(options).execute().then(when(done, function (result) {
            expect(result.getNative()).to.equal(22);
        }), done);
    });

    it('should correctly trap a parse error in included file', function (done) {
        var module = new Function(
                'require',
                'return require(\'phpruntime\').compile(function (stdin, stdout, stderr, tools, namespace) {' +
                'var namespaceScope = tools.createNamespaceScope(namespace), namespaceResult, scope = tools.globalScope, currentClass = null;' +
                'scope.getVariable("num").setValue(tools.include(tools.valueFactory.createString("abc.php").getNative()));' +
                'return scope.getVariable("num").getValue();' +
                'return tools.valueFactory.createNull();' +
                '});'
            )(function () {
                return phpRuntime;
            }),
            options = {
                include: function (path, promise) {
                    promise.resolve('<?php abab');
                }
            };

        module(options).execute().then(function (result) {
            done(new Error('Expected rejection, got resolve: ' + result));
        }, when(done, function (error) {
            expect(error.message).to.equal('PHP Parse error: syntax error, unexpected $end in abc.php on line 1');
        }));
    });
});
