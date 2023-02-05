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
    phpCommon = require('phpcommon'),
    tools = require('../../../../tools'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('PHP "SplQueue" builtin class integration', function () {
    describe('count()', function () {
        it('should fetch a count of all items in the queue', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$queue = new SplQueue;

$queue->enqueue('my first value');
$result['count with 1'] = count($queue);

$queue->enqueue('my second value');
$result['count with 2'] = count($queue);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'count with 1': 1,
                'count with 2': 2
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });
    });

    describe('dequeue()', function () {
        it('should dequeue items previously pushed onto the queue', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$queue = new SplQueue;

$queue->push('first');
$queue->push('second');
$queue->push('third');

$result['first dequeue'] = $queue->dequeue();
$result['second dequeue'] = $queue->dequeue();
$result['third dequeue'] = $queue->dequeue();

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'first dequeue': 'first',
                'second dequeue': 'second',
                'third dequeue': 'third'
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });

        it('should raise a fatal error when the queue is empty', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php

$queue = new SplQueue;

$queue->dequeue();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            await expect(engine.execute()).to.eventually.be.rejectedWith(
                PHPFatalError,
                'PHP Fatal error: Uncaught Error: Can\'t shift from an empty datastructure ' +
                'in /path/to/my_module.php on line 5'
            );
        });
    });

    describe('enqueue()', function () {
        it('should enqueue items in the queue', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$queue = new SplQueue;

$queue->enqueue('first');
$queue->enqueue('second');
$queue->enqueue('third');

$result['first dequeue'] = $queue[0];
$result['second dequeue'] = $queue[1];
$result['third dequeue'] = $queue[2];

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'first dequeue': 'first',
                'second dequeue': 'second',
                'third dequeue': 'third'
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });
    });
});
