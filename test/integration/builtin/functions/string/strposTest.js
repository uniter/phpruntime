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

describe('PHP "strpos" builtin function integration', function () {
    it('should be able to find a substring', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = strpos('', 'my substring');
$result['substring found, no offset'] = strpos('my string not your string', 'not');
$result['substring found, after positive offset'] = strpos('my string not your string', 'string', 12);
$result['substring found, after negative offset back from end'] = strpos('my string not your string', 'string', -8);
$result['substring not found, with positive offset'] = strpos('my string goes here', 'missing');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': false,
            'substring found, no offset': 10,
            'substring found, after positive offset': 19,
            'substring found, after negative offset back from end': 19,
            'substring not found, with positive offset': false
        });
    });
});
