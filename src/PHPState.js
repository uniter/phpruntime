/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    EXCEPTION_CLASS = 'Exception',
    builtinTypes = require('./builtin/builtins'),
    CallStack = require('./CallStack'),
    ClassAutoloader = require('./ClassAutoloader'),
    INIState = require('./INIState'),
    Namespace = require('./Namespace'),
    ReferenceFactory = require('./ReferenceFactory'),
    Scope = require('./Scope'),
    ValueFactory = require('./ValueFactory'),
    setUpState = function (state) {
        var globalNamespace = state.globalNamespace,
            internals = {
                callStack: state.callStack,
                classAutoloader: state.classAutoloader,
                globalNamespace: globalNamespace,
                iniState: state.iniState,
                pausable: state.pausable,
                stdout: state.stdout,
                valueFactory: state.valueFactory
            };

        _.each(builtinTypes.functionGroups, function (groupFactory) {
            var groupBuiltins = groupFactory(internals);

            _.each(groupBuiltins, function (fn, name) {
                globalNamespace.defineFunction(name, fn);
            });
        });

        _.each(builtinTypes.classes, function (classFactory, name) {
            var Class = classFactory(internals);

            if (name === EXCEPTION_CLASS) {
                state.PHPException = Class;
            }

            globalNamespace.defineClass(name, Class);
        });

        _.each(builtinTypes.constantGroups, function (groupFactory) {
            var groupBuiltins = groupFactory(internals);

            _.each(groupBuiltins, function (value, name) {
                globalNamespace.defineConstant(name, state.valueFactory.coerce(value));
            });
        });
    };

function PHPState(stdin, stdout, stderr, pausable, options) {
    var callStack = new CallStack(stderr),
        valueFactory = new ValueFactory(callStack),
        classAutoloader = new ClassAutoloader(valueFactory),
        globalNamespace = new Namespace(callStack, valueFactory, classAutoloader, null, '');

    classAutoloader.setGlobalNamespace(globalNamespace);
    valueFactory.setGlobalNamespace(globalNamespace);

    this.callStack = callStack;
    this.globalNamespace = globalNamespace;
    this.globalScope = new Scope(callStack, valueFactory, null, null);
    this.iniState = new INIState();
    this.options = options;
    this.path = null;
    this.referenceFactory = new ReferenceFactory(valueFactory);
    this.callStack = callStack;
    this.classAutoloader = classAutoloader;
    this.pausable = pausable;
    this.stdin = stdin;
    this.stdout = stdout;
    this.valueFactory = valueFactory;
    this.PHPException = null;

    setUpState(this);
}

_.extend(PHPState.prototype, {
    getCallStack: function () {
        return this.callStack;
    },

    getGlobalNamespace: function () {
        return this.globalNamespace;
    },

    getGlobalScope: function () {
        return this.globalScope;
    },

    getOptions: function () {
        return this.options;
    },

    getPath: function () {
        var path = this.path;

        return path === null ? '(program)' : path;
    },

    getPHPExceptionClass: function () {
        return this.PHPException;
    },

    getReferenceFactory: function () {
        return this.referenceFactory;
    },

    getPausable: function () {
        return this.pausable;
    },

    getStderr: function () {
        return this.stderr;
    },

    getStdin: function () {
        return this.stdin;
    },

    getStdout: function () {
        return this.stdout;
    },

    getValueFactory: function () {
        return this.valueFactory;
    },

    isMainProgram: function () {
        return this.path === null;
    },

    setPath: function (path) {
        this.path = path;
    }
});

module.exports = PHPState;
