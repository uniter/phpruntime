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

describe('PHP "ctype_graph" builtin function integration', function () {
    it('should be able to check if all characters in a string are printable and create visible output', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ctype_graph('');
$result['all printable'] = ctype_graph('abc123!@#');
$result['with spaces'] = ctype_graph('abc 123');
$result['with control chars'] = ctype_graph("abc\n");
$result['with non-printable'] = ctype_graph("abc\x00");

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'all printable': true,
            'with spaces': false,
            'with control chars': false,
            'with non-printable': false
        });
    });
});