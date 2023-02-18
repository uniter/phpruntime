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
    tools = require('../../../../tools');

describe('PHP "usleep" builtin function integration', function () {
    it('should be able to pause via a JS timeout in async mode', function (done) {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

log('start');

$result['before'] = microtime(true); // Log the start time
usleep(1500 * 1000);
$result['after'] = microtime(true); // Log the end time

log('end');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            environment = tools.createAsyncEnvironment({
                performance: {
                    getTimeInMicroseconds: function () {
                        return Date.now() * 1000;
                    }
                }
            }),
            engine = module({}, environment),
            log = [];
        this.timeout(5000);

        engine.defineCoercingFunction('log', function (message) {
            log.push('[log]: ' + message);
        });

        log.push('[before execute]');
        engine.execute().then(function (resultValue) {
            var result = resultValue.getNative();

            // Ensure that execution was successfully paused and control
            // returned to the caller (ie. ensure we didn't fall into the busy-wait loop).
            expect(log).to.deep.equal([
                '[before execute]',
                '[after execute]',
                // Due to the async-opcode behaviour enforced by PHPTest,
                // the promise executor will return before the program reaches the first log() call.
                '[log]: start',
                '[log]: end'
            ]);
            // Ensure we slept for at least the 1500ms delay (will almost certainly
            // be greater due to other statements taking a non-negligible amount of time).
            expect(result.after - result.before).to.be.at.least(1.5);
            done();
        }).catch(done);
        log.push('[after execute]');
    });

    it('should be able to pause via a busy-wait loop in sync mode', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

log('start');

$result['before'] = microtime(true); // Log the start time
usleep(1500 * 1000);
$result['after'] = microtime(true); // Log the end time

log('end');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile('/path/to/my_module.php', php),
            environment = tools.createSyncEnvironment({
                performance: {
                    getTimeInMicroseconds: function () {
                        return Date.now() * 1000;
                    }
                }
            }),
            engine = module({}, environment),
            log = [],
            result;

        engine.defineCoercingFunction('log', function (message) {
            log.push('[log]: ' + message);
        });

        log.push('[before execute]');
        result = engine.execute().getNative();
        log.push('[after execute]');

        // Ensure that execution was successfully paused and control
        // returned to the caller (ie. ensure we didn't fall into the busy-wait loop).
        expect(log).to.deep.equal([
            '[before execute]',
            '[log]: start',
            '[log]: end',
            '[after execute]'
        ]);
        // Ensure we slept for at least the 1500ms delay (will almost certainly
        // be greater due to other statements taking a non-negligible amount of time).
        expect(result.after - result.before).to.be.at.least(1.5);
    });
});
