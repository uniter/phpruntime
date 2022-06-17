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

describe('PHP "rtrim" builtin function integration', function () {
    it('should be able to trim characters from the end of a string', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['with default character mask'] = rtrim("\t\n\r\0\x0b    middle    \t\n\r\0\x0b");
$result['with custom character mask'] = rtrim("zzz\t\n\r\0\x0b    middle    xyz", 'xzy');
$result['with character mask using regex special chars'] = rtrim("]yy]y my string yyy", ']y');

$result['relying on coercion'] = rtrim(true);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'with default character mask': '\t\n\r\0\x0b    middle',
            'with custom character mask': 'zzz\t\n\r\0\x0b    middle    ',
            'with character mask using regex special chars': ']yy]y my string ',
            'relying on coercion': '1'
        });
    });
});
