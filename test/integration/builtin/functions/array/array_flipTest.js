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

describe('PHP "array_flip" builtin function integration', function () {
    it('should be able to flip an array with values that make valid keys', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = [
    'key one' => 'value one',
    'key two' => 'value two',
    'key three' => 1003,
    'key four' => 1004
];

$result = array_flip($myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'value one': 'key one',
            'value two': 'key two',
            1003: 'key three',
            1004: 'key four'
        });
    });

    it('should be able to flip an array with elements that are references that pause', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = [
    'key one' => 'value one',
    'key two' => 'value two',
    'key three' => 1003,
    'key four' => 1004,
    'key five' => &$myAccessor
];

$result = array_flip($myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();
        engine.defineGlobalAccessor(
            'myAccessor',
            function () {
                return this.createAsyncPresent('my async value');
            }
        );

        expect((await engine.execute()).getNative()).to.deep.equal({
            'value one': 'key one',
            'value two': 'key two',
            1003: 'key three',
            1004: 'key four',
            'my async value': 'key five'
        });
    });
});
