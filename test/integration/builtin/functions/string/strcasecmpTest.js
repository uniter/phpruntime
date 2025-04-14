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

describe('PHP "strcasecmp" builtin function integration', function () {
    it('should be able to perform case-insensitive string comparisons', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['equal strings'] = strcasecmp('Hello', 'hello');
$result['first greater'] = strcasecmp('Hello', 'Hallo');
$result['first less'] = strcasecmp('Hallo', 'Hello');
$result['string2 longer than string1'] = strcasecmp('Hello', 'Hello World');
$result['string1 longer than string2'] = strcasecmp('Hello World', 'Hello');
$result['empty strings'] = strcasecmp('', '');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'equal strings': 0,
            'first greater': 4, // 'e' (101) - 'a' (97) = 4.
            'first less': -4,   // 'a' (97) - 'e' (101) = -4.
            'string2 longer than string1': -6,
            'string1 longer than string2': 6,
            'empty strings': 0
        });
    });
});
