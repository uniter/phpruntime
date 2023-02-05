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

describe('PHP "trim" builtin function integration', function () {
    it('should be able to trim a string', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['with default character mask'] = trim("\t\n\r\0\x0b    middle    \t\n\r\0\x0b");
$result['with custom character mask'] = trim("zzz\t\n\r\0\x0b    middle    xyz", 'xzy');
$result['with character mask using regex special chars'] = trim("]yy]y my string yy\\y", ']y-\\');

$result['with range syntax ".."'] = trim('hello world', 'b..r');
$result['with redundant range syntax ".."'] = trim('hello world', 'h..h');
$result['with range that uses regex char set range char "-"'] = trim('--/--hello world /-.', 'X-../Y');
$result['with multiple range syntax ".."'] = trim('dhello worldq', 'd..dl..r');

$result['relying on coercion'] = trim(true);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'with default character mask': 'middle',
            'with custom character mask': '\t\n\r\0\x0b    middle    ',
            'with character mask using regex special chars': ' my string ',
            'with range syntax ".."': ' w',
            'with redundant range syntax ".."': 'ello world',
            'with range that uses regex char set range char "-"': 'hello world ',
            'with multiple range syntax ".."': 'hello w',
            'relying on coercion': '1'
        });
    });

    it('should handle invalid ranges correctly', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['where range is missing left and right chars'] = trim('hello world', '..');
$result['where range is missing left char but has literal matches'] = trim('..hello world.', '..d');
$result['where range is missing right char but has literal matches'] = trim('...hello world.', 'd..');
$result['where range is decrementing but has literal matches'] = trim('....hello world.', 'l..d');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'where range is missing left and right chars': 'hello world',
            'where range is missing left char but has literal matches': 'hello worl',
            'where range is missing right char but has literal matches': 'hello worl',
            'where range is decrementing but has literal matches': 'hello wor'
        });
        expect(engine.getStderr().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
PHP Warning:  trim(): Invalid '..'-range, no character to the left of '..' in /path/to/my_module.php on line 5
PHP Warning:  trim(): Invalid '..'-range, no character to the left of '..' in /path/to/my_module.php on line 6
PHP Warning:  trim(): Invalid '..'-range, no character to the right of '..' in /path/to/my_module.php on line 7
PHP Warning:  trim(): Invalid '..'-range, '..'-range needs to be incrementing in /path/to/my_module.php on line 8

EOS
*/;}) //jshint ignore:line
        );
    });
});
