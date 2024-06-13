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

describe('PHP "sprintf" builtin function integration', function () {
    it('should be able to format a string', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$substitute = 'contain';
$result[] = sprintf('I contain no conversion %% specifications');
$result[] = sprintf('I %s string conversion specifications %s', $substitute, 'inside');
$result[] = sprintf('A padded number: %\'~5d and a string: %s in here', 21, '(hello!)');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'I contain no conversion % specifications',
            'I contain string conversion specifications inside',
            'A padded number: ~~~21 and a string: (hello!) in here'
        ]);
    });

    it('should correctly handle errors formatting the string', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
ini_set('error_reporting', E_ALL);

$result = [];

function tryCall(callable $callback) {
    $result = null;
    $throwable = null;

    try {
        $result = $callback();
    } catch (\Throwable $caughtThrowable) {
        $throwable = $caughtThrowable::class . ' :: ' . $caughtThrowable->getMessage();
    }

    return [
        'result' => $result,
        'throwable' => $throwable
    ];
}

$result['missing argument for implicit parameter'] = tryCall(function () {
    return sprintf('hello %s there');
});
$result['missing argument for explicit parameter'] = tryCall(function () {
    return sprintf('hello %21$d there', 100, 200, 300);
});

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'missing argument for implicit parameter': {
                'result': null,
                'throwable': 'ArgumentCountError :: 2 arguments are required, 1 given'
            },
            'missing argument for explicit parameter': {
                'result': null,
                'throwable': 'ArgumentCountError :: 22 arguments are required, 4 given'
            }
        });
    });
});
