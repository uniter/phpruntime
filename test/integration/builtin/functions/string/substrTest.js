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

describe('PHP "substr" builtin function integration', function () {
    it('should be able to extract substrings', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['positive offset and length'] = substr('my string to extract from', 4, 3);
$result['positive offset and negative length'] = substr('my string to extract from', 4, -2);
$result['negative offset and positive length'] = substr('my string to extract from', -12, 4);
$result['negative offset and length'] = substr('my string to extract from', -4, -1);
$result['length omitted'] = substr('my string to extract from', 10);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'positive offset and length': 'tri',
            'positive offset and negative length': 'tring to extract fr',
            'negative offset and positive length': 'extr',
            'negative offset and length': 'fro',
            'length omitted': 'to extract from'
        });
    });
});
