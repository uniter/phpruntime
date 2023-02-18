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

describe('PHP "SplObjectStorage" builtin class integration', function () {
    describe('attach()', function () {
        it('should allow objects to be attached', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myKey = new stdClass;
$storage = new SplObjectStorage;

$storage->attach($myKey, 'my value');

$result['fetching value via offsetGet'] = $storage[$myKey];

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'fetching value via offsetGet': 'my value'
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });
    });

    describe('count()', function () {
        it('should fetch a count of all objects in the storage', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myFirstKey = new stdClass;
$mySecondKey = new stdClass;
$storage = new SplObjectStorage;

$storage->attach($myFirstKey, 'my first value');
$result['count with 1'] = count($storage);

$storage->attach($mySecondKey, 'my second value');
$result['count with 2'] = count($storage);

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

    describe('offsetExists()', function () {
        it('should determine whether the object exists in the storage', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myKey = new stdClass;
$notMyKey = new stdClass;
$storage = new SplObjectStorage;

$storage->attach($myKey, 'my value');
$result['with valid key'] = isset($storage[$myKey]);

$result['with invalid key'] = isset($storage[$notMyKey]);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'with valid key': true,
                'with invalid key': false
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });
    });

    describe('offsetGet()', function () {
        it('should fetch the value from the storage', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myFirstKey = new stdClass;
$mySecondKey = new stdClass;
$storage = new SplObjectStorage;

$storage->attach($myFirstKey, 'my first value');
$storage->attach($mySecondKey, 'my second value');

$result['with first key'] = $storage[$myFirstKey];
$result['with second key'] = $storage[$mySecondKey];

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'with first key': 'my first value',
                'with second key': 'my second value'
            });
            expect(engine.getStderr().readAll()).to.equal('');
        });
    });
});
