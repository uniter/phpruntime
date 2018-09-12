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
    tools = require('../../tools'),
    debuggerPlugin = require('../../../../src/plugin/debugger');

describe('PHP debugger step-over integration', function () {
    it('should support stepping over a function call', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

log('first');

// Make a function call so that we can step over it
myFunc();
log('second');

log('third');

function myFunc()
{
    log('fourth');

    log('fifth');
}

EOS
*/;}), //jshint ignore:line
            asyncRuntime = tools.createAsyncRuntime(),
            log = [],
            module = tools.transpile(asyncRuntime, null, php, {
                phpToAST: {
                    captureAllBounds: true
                },
                phpToJS: {
                    tick: true
                }
            }),
            engine;

        asyncRuntime.install(debuggerPlugin);
        engine = module({
            path: '/my/debuggable/script.php',
            debugger: {
                onAttach: function (driver) {
                    driver.addLineBreakpoint('/my/debuggable/script.php', 6);

                    driver.on('line_breakpoint', function (path, startLine, startColumn, endLine, endColumn) {
                        log.push('breakpoint hit, execution paused... :: ' + path + '@' + startLine + ':' + startColumn + '-' + endLine + ':' + endColumn);

                        log.push('waiting before stepping over...');

                        setTimeout(function () {
                            log.push('stepping over...');
                            driver.stepOver();
                        }, 1);
                    });

                    driver.on('stepped_over', function (path, startLine, startColumn, endLine, endColumn) {
                        log.push('stepped over, execution paused again... :: ' + path + '@' + startLine + ':' + startColumn + '-' + endLine + ':' + endColumn);

                        log.push('waiting before resume...');

                        setTimeout(function () {
                            log.push('resuming...');
                            driver.resume();
                        }, 1);
                    });

                    // Debugging will have been paused, so continue
                    driver.resume();
                }
            }
        });

        engine.defineCoercingFunction('log', function (value) {
            log.push('log() :: ' + value);

            return value;
        });

        return engine.execute().then(function () {
            expect(log).to.deep.equal([
                'log() :: first',
                'breakpoint hit, execution paused... :: /my/debuggable/script.php@6:1-6:10',
                'waiting before stepping over...',
                'stepping over...',
                'log() :: fourth',
                'log() :: fifth',
                'stepped over, execution paused again... :: /my/debuggable/script.php@7:1-7:15',
                'waiting before resume...',
                'resuming...',
                'log() :: second',
                'log() :: third'
            ]);
        });
    });

    it('should support stepping over the last statement in a function, pausing at the next statement in a caller', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

function firstFunc() {
    log('first');
    secondFunc();
    log('second');
}

function secondFunc() {
    log('third');
    thirdFunc();
}

function thirdFunc() {
    log('fourth');
    fourthFunc();
}

function fourthFunc() {
    log('fifth');
}

log('sixth');
firstFunc();
log('seventh');
EOS
*/;}), //jshint ignore:line
            asyncRuntime = tools.createAsyncRuntime(),
            log = [],
            module = tools.transpile(asyncRuntime, null, php, {
                phpToAST: {
                    captureAllBounds: true
                },
                phpToJS: {
                    tick: true
                }
            }),
            engine;

        asyncRuntime.install(debuggerPlugin);
        engine = module({
            path: '/my/debuggable/script.php',
            debugger: {
                onAttach: function (driver) {
                    driver.addLineBreakpoint('/my/debuggable/script.php', 20); // Pause on the line printing "fifth"

                    driver.on('line_breakpoint', function (path, startLine, startColumn, endLine, endColumn) {
                        log.push('breakpoint hit, execution paused... :: ' + path + '@' + startLine + ':' + startColumn + '-' + endLine + ':' + endColumn);

                        log.push('waiting before stepping over...');

                        setTimeout(function () {
                            log.push('stepping over...');
                            driver.stepOver();
                        }, 1);
                    });

                    driver.on('stepped_over', function (path, startLine, startColumn, endLine, endColumn) {
                        log.push('stepped over, execution paused again... :: ' + path + '@' + startLine + ':' + startColumn + '-' + endLine + ':' + endColumn);

                        log.push('waiting before resume...');

                        setTimeout(function () {
                            log.push('resuming...');
                            driver.resume();
                        }, 1);
                    });

                    // Debugging will have been paused, so continue
                    driver.resume();
                }
            }
        });

        engine.defineCoercingFunction('log', function (value) {
            log.push('log() :: ' + value);

            return value;
        });

        return engine.execute().then(function () {
            expect(log).to.deep.equal([
                'log() :: sixth',
                'log() :: first',
                'log() :: third',
                'log() :: fourth',
                'breakpoint hit, execution paused... :: /my/debuggable/script.php@20:5-20:18',
                'waiting before stepping over...',
                'stepping over...',
                'log() :: fifth',
                'stepped over, execution paused again... :: /my/debuggable/script.php@6:5-6:19',
                'waiting before resume...',
                'resuming...',
                'log() :: second',
                'log() :: seventh'
            ]);
        });
    });
});
