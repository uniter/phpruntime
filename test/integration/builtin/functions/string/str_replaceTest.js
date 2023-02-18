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

describe('PHP "str_replace" builtin function integration', function () {
    it('should be able to find and replace substrings', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['search and replacement both strings'] = str_replace('l', 'x', 'hello world');
$result['search array, replacement string'] = str_replace(['l', 'w'], 'x', 'hello world');
$result['search and replacement both arrays'] = str_replace(['l', 'w'], ['x', 'B'], 'hello world');

$result['with count captured'] = [
    'result' => str_replace(['l', 'w'], ['x', 'B'], 'hello world', $count),
    'count' => $count
];

$result['with subject array and count captured'] = [
    'result' => str_replace(['l', 'w'], ['x', 'B'], ['hello world', 'world'], $count),
    'count' => $count
];

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'search and replacement both strings': 'hexxo worxd',
            'search array, replacement string': 'hexxo xorxd',
            'search and replacement both arrays': 'hexxo Borxd',
            'with count captured': {
                'result': 'hexxo Borxd',
                'count': 4
            },
            'with subject array and count captured': {
                'result': [
                    'hexxo Borxd',
                    'Borxd',
                ],
                'count': 6
            }
        });
    });
});
