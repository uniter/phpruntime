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

describe('PHP "strrchr" builtin function integration', function () {
    it('should be able to extract the portion of haystack after the last occurrence of needle', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = strrchr('this is my string', 'i');
$result[] = strrchr('abcdabcdabcdabcd', 'bIGNORED');
$result[] = strrchr('hello', 'x');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'ing',
            'bcd',
            false // Needle not found.
        ]);
    });
});
