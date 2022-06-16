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

describe('PHP "reset" builtin function integration', function () {
    it('should be able to reset and return the first element of an array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myArray = ['first', 'a_key' => 'second', 'third'];

$result['current #1'] = current($myArray);
$result['next #1'] = next($myArray);
$result['next #2'] = next($myArray);
$result['reset'] = reset($myArray);
$result['next #3'] = next($myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'current #1': 'first',
            'next #1': 'second',
            'next #2': 'third',
            'reset': 'first',
            'next #3': 'second'
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
