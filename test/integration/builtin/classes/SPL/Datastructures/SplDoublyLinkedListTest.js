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

describe('PHP "SplDoublyLinkedList" builtin class integration', function () {
    describe('count()', function () {
        it('should fetch a count of all items in the list', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$list = new SplDoublyLinkedList;

$list->push('my first value');
$result['count with 1'] = count($list);

$list->push('my second value');
$result['count with 2'] = count($list);

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

    describe('isEmpty()', function () {
        it('should return true only when the list is empty', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$list = new SplDoublyLinkedList;

$result['when empty'] = $list->isEmpty();

$list->push('my value');
$result['with one item'] = $list->isEmpty();

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'when empty': true,
                'with one item': false
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });
    });

    describe('pop()', function () {
        it('should pop items from the end of the list', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$list = new SplDoublyLinkedList;

$list->push('first');
$list->push('second');
$list->push('third');

$result['first item'] = $list->pop();
$result['second item'] = $list->pop();
$result['third item'] = $list->pop();

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'first item': 'third',
                'second item': 'second',
                'third item': 'first'
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });

        it('should raise a fatal error when the list is empty', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php

$list = new SplDoublyLinkedList;

$list->pop();
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            await expect(engine.execute()).to.eventually.be.rejectedWith(
                PHPFatalError,
                'PHP Fatal error: Uncaught Error: Can\'t pop from an empty datastructure ' +
                'in /path/to/my_module.php on line 5'
            );
        });
    });

    describe('push()', function () {
        it('should push items onto the list', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$list = new SplDoublyLinkedList;

$list->push('first');
$list->push('second');
$list->push('third');

$result['first item'] = $list[0];
$result['second item'] = $list[1];
$result['third item'] = $list[2];

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'first item': 'first',
                'second item': 'second',
                'third item': 'third'
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });
    });

    describe('shift()', function () {
        it('should shift items from the beginning of the list', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$list = new SplDoublyLinkedList;

$list->push('first');
$list->push('second');
$list->push('third');

$result['first item'] = $list->shift();
$result['second item'] = $list->shift();
$result['third item'] = $list->shift();

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'first item': 'first',
                'second item': 'second',
                'third item': 'third'
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });

        it('should raise a fatal error when the list is empty', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php

$list = new SplDoublyLinkedList;

$list->shift();
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
});
