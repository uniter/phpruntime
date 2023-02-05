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

describe('PHP "array_key_exists" builtin function integration', function () {
    it('should be able to determine whether an array defines an element with the given key', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = [
    'my numerically indexed value',
    'my_element' => 'my value',
    'my_null_element' => null
];

$result = [];
$result['numeric key'] = array_key_exists(0, $myArray);
$result['string key'] = array_key_exists('my_element', $myArray);
$result['null value element'] = array_key_exists('my_null_element', $myArray);
$result['undefined string key'] = array_key_exists('not_my_key', $myArray);
$result['undefined numeric key'] = array_key_exists(123, $myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'numeric key': true, // Should work for numeric keys too.
            'string key': true,
            'null value element': true, // Unlike isset(...), should return true even for elements with a value of NULL.
            'undefined string key': false,
            'undefined numeric key': false
        });
    });
});
