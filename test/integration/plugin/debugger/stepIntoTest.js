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

describe('PHP debugger step-into integration', function () {
    it('should support stepping into a function call', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

log('first');

// Make a function call so that we can step into it
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

                        log.push('waiting before stepping into...');

                        setTimeout(function () {
                            log.push('stepping into...');
                            driver.stepInto();
                        }, 1);
                    });

                    driver.on('stepped_into', function (path, startLine, startColumn, endLine, endColumn) {
                        log.push('stepped into, execution paused again... :: ' + path + '@' + startLine + ':' + startColumn + '-' + endLine + ':' + endColumn);

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
                'waiting before stepping into...',
                'stepping into...',
                'stepped into, execution paused again... :: /my/debuggable/script.php@13:5-13:19',
                'waiting before resume...',
                'resuming...',
                'log() :: fourth',
                'log() :: fifth',
                'log() :: second',
                'log() :: third'
            ]);
        });
    });
});
