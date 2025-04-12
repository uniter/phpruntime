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

describe('PHP "lcfirst" builtin function integration', function () {
    it('should convert the first character of a string to lowercase', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string'] = lcfirst('');
$result['uppercase first'] = lcfirst('Hello World');
$result['already lowercase'] = lcfirst('hello world');
$result['single character'] = lcfirst('A');
$result['special character'] = lcfirst('@Hello');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string': '',
            'uppercase first': 'hello World',
            'already lowercase': 'hello world',
            'single character': 'a',
            'special character': '@Hello'
        });
    });
});