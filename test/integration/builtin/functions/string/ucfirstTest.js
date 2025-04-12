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

describe('PHP "ucfirst" builtin function integration', function () {
    it('should convert the first character of a string to uppercase', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = ucfirst('');
$result['lowercase first'] = ucfirst('hello world');
$result['already uppercase'] = ucfirst('Hello world');
$result['single character'] = ucfirst('a');
$result['special character'] = ucfirst('@hello');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': '',
            'lowercase first': 'Hello world',
            'already uppercase': 'Hello world',
            'single character': 'A',
            'special character': '@hello'
        });
    });
});
