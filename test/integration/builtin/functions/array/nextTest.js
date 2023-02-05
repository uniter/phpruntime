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
    tools = require('../../../tools');

describe('PHP "next" builtin function integration', function () {
    it('should be able to fetch the next element of an array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myArray = ['first', 'a_key' => 'second', 'third'];

$result['current #1'] = current($myArray);
$result['next #1'] = next($myArray);
$result['current #2'] = current($myArray);
$result['next #2'] = next($myArray);
$result['current #3'] = current($myArray);
$result['next #3'] = next($myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'current #1': 'first',
            'next #1': 'second',
            'current #2': 'second',
            'next #2': 'third',
            'current #3': 'third',
            'next #3': false // False is returned when there are no more items.
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should be able to fetch the next element of an object', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myObject = (object)['first', 'a_key' => 'second', 'third'];

$result['current #1'] = current($myObject);
$result['next #1'] = next($myObject);
$result['current #2'] = current($myObject);
$result['next #2'] = next($myObject);
$result['current #3'] = current($myObject);
$result['next #3'] = next($myObject);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'current #1': 'first',
            'next #1': 'second',
            'current #2': 'second',
            'next #2': 'third',
            'current #3': 'third',
            'next #3': false // False is returned when there are no more items.
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
