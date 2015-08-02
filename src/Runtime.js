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
    INCLUDE_OPTION = 'include',
    Call = require('./Call'),
    KeyValuePair = require('./KeyValuePair'),
    List = require('./List'),
    NamespaceScope = require('./NamespaceScope'),
    ObjectValue = require('./Value/Object'),
    PHPState = require('./PHPState'),
    Promise = require('bluebird'),
    Scope = require('./Scope'),
    Stream = require('./Stream');

function Runtime(phpCommon) {
    this.phpCommon = phpCommon;
}

_.extend(Runtime.prototype, {
    compile: function (wrapper, pausable, phpToAST, phpToJS) {
        var runtime = this,
            phpCommon = runtime.phpCommon,
            PHPError = phpCommon.PHPError,
            PHPFatalError = phpCommon.PHPFatalError;

        return function (options, state, tools, phpParser, context) {
            var callStack,
                exports = {},
                globalNamespace,
                globalScope,
                PHPException,
                referenceFactory,
                stderr,
                stdin,
                stdout,
                valueFactory;

            function include(path) {
                var done = false,
                    promise,
                    pause = null,
                    result;

                function completeWith(moduleResult) {
                    if (pause) {
                        pause.resume(moduleResult);
                    } else {
                        result = moduleResult;
                    }
                }

                if (!options[INCLUDE_OPTION]) {
                    throw new Error(
                        'include(' + path + ') :: No "include" transport is available for loading the module.'
                    );
                }

                promise = new Promise(function (resolve, reject) {
                    options[INCLUDE_OPTION](path, {
                        reject: reject,
                        resolve: resolve
                    });
                });

                promise.then(function (module) {
                    var subWrapper,
                        subModule;

                    done = true;

                    // Handle PHP code string being returned from loader for module
                    if (_.isString(module)) {
                        if (!phpParser) {
                            throw new Error('include(' + path + ') :: PHP parser is not available');
                        }

                        if (!phpToJS) {
                            throw new Error('include(' + path + ') :: PHPToJS is not available');
                        }

                        /*jshint evil: true */
                        subWrapper = new Function(
                            'return ' +
                            phpToJS.transpile(phpParser.parse(module), {'bare': true}) +
                            ';'
                        )();

                        subModule = runtime.compile(subWrapper);

                        subModule(options, state, tools, phpParser, context).then(
                            completeWith,
                            function (error) {
                                throw error;
                            }
                        );

                        return;
                    }

                    // Handle wrapper function being returned from loader for module
                    if (_.isFunction(module)) {
                        completeWith(module(options, state, tools, phpParser, context));
                        return;
                    }

                    throw new Error('include(' + path + ') :: Module is in a weird format');
                }, function () {
                    done = true;

                    callStack.raiseError(
                        PHPError.E_WARNING,
                        'include(' + path + '): failed to open stream: No such file or directory'
                    );
                    callStack.raiseError(
                        PHPError.E_WARNING,
                        'include(): Failed opening \'' + path + '\' for inclusion'
                    );

                    completeWith(valueFactory.createNull());
                });

                if (done) {
                    return result;
                }

                if (!pausable) {
                    // Pausable is not available, so we cannot yield while the module is loaded
                    throw new Error('include(' + path + ') :: Async support not enabled');
                }

                pause = pausable.createPause();
                pause.now();
            }

            if (!state) {
                // No state given to load: initialize the environment
                state = new PHPState(new Stream(), new Stream(), new Stream(), pausable, options);
                if (phpToAST) {
                    phpParser = phpToAST.create(state.getStderr());
                }

                globalScope = state.getGlobalScope();
                referenceFactory = state.getReferenceFactory();
                valueFactory = state.getValueFactory();

                tools = {
                    createClosure: function (func, scope) {
                        func.scopeWhenCreated = scope;

                        return tools.valueFactory.createObject(
                            func,
                            globalNamespace.getClass('Closure')
                        );
                    },
                    createInstance: function (namespaceScope, classNameValue, args) {
                        var className = classNameValue.getNative(),
                            classObject = namespaceScope.getClass(className);

                        return classObject.instantiate(args);
                    },
                    createKeyValuePair: function (key, value) {
                        return new KeyValuePair(key, value);
                    },
                    createList: function (elements) {
                        return new List(elements);
                    },
                    createNamespaceScope: function (namespace) {
                        return new NamespaceScope(globalNamespace, namespace);
                    },
                    getPath: function () {
                        return valueFactory.createString(context.path);
                    },
                    getPathDirectory: function () {
                        return valueFactory.createString(state.getPath().replace(/\/[^\/]+$/, ''));
                    },
                    globalScope: globalScope,
                    implyArray: function (variable) {
                        // Undefined variables and variables containing null may be implicitly converted to arrays
                        if (!variable.isDefined() || variable.getValue().getType() === 'null') {
                            variable.setValue(valueFactory.createArray([]));
                        }

                        return variable.getValue();
                    },
                    implyObject: function (variable) {
                        return variable.getValue();
                    },
                    include: include,
                    popCall: function () {
                        callStack.pop();
                    },
                    pushCall: function (thisObject, currentClass) {
                        var call;

                        if (!valueFactory.isValue(thisObject)) {
                            thisObject = null;
                        }

                        call = new Call(new Scope(callStack, valueFactory, thisObject, currentClass));

                        callStack.push(call);

                        return call;
                    },
                    referenceFactory: referenceFactory,
                    requireOnce: include,
                    require: include,
                    throwNoActiveClassScope: function () {
                        throw new PHPFatalError(PHPFatalError.SELF_WHEN_NO_ACTIVE_CLASS);
                    },
                    valueFactory: valueFactory
                };
            }

            globalNamespace = state.getGlobalNamespace();
            callStack = state.getCallStack();
            globalScope = state.getGlobalScope();
            options = state.getOptions();
            stderr = state.getStderr();
            stdin = state.getStdin();
            stdout = state.getStdout();
            PHPException = state.getPHPExceptionClass();

            // Push the 'main' global scope call onto the stack
            callStack.push(new Call(globalScope));

            return new Promise(function (resolve, reject) {
                var code;

                function handleResult(resultValue) {
                    resolve(resultValue);
                }

                function handleError(error) {
                    if (error instanceof ObjectValue) {
                        // Uncaught PHP Exceptions become E_FATAL errors
                        (function (value) {
                            var error = value.getNative();

                            if (!(error instanceof PHPException)) {
                                throw new Error('Weird value class thrown: ' + value.getClassName());
                            }

                            error = new PHPFatalError(
                                PHPFatalError.UNCAUGHT_EXCEPTION,
                                {
                                    name: value.getClassName()
                                }
                            );

                            if (context.mainProgram) {
                                stderr.write(error.message);
                            }

                            reject(error);
                        }(error));

                        return;
                    }

                    if (error instanceof PHPError) {
                        if (context.mainProgram) {
                            stderr.write(error.message);
                        }

                        reject(error);
                        return;
                    }

                    throw error;
                }

                // Use asynchronous mode if Pausable is available
                if (pausable) {
                    code = 'exports.result = (' +
                        wrapper.toString() +
                        '(stdin, stdout, stderr, tools, globalNamespace));';

                    pausable.execute(code, {
                        expose: {
                            exports: exports,
                            stdin: stdin,
                            stdout: stdout,
                            stderr: stderr,
                            tools: tools,
                            globalNamespace: globalNamespace
                        }
                    }).done(function () {
                        handleResult(exports.result);
                    }).fail(handleError);

                    return;
                }

                // Otherwise load the module synchronously
                handleResult(wrapper(stdin, stdout, stderr, tools, globalNamespace));
            });
        };
    }
});

module.exports = Runtime;
