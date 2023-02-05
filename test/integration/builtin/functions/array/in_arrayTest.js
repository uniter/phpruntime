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

describe('PHP "in_array" builtin function integration', function () {
    it('should be able to determine whether an array contains a value', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myArray = ['first', '21'];

$result[] = in_array('first', $myArray);
$result[] = in_array('21', $myArray);
$result[] = in_array(21, $myArray, true);
$result[] = in_array(1001, $myArray, true);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            true,
            true,
            false, // Strict matching enabled, but types differ
            false
        ]);
    });
});
