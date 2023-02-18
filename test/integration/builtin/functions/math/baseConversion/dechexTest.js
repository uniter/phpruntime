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
    tools = require('../../../../tools');

describe('PHP "dechex" builtin function integration', function () {
    it('should convert the specified decimals to hexadecimal', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    dechex(7),
    dechex(10),
    dechex(15), // Hexadecimal is base-16, so test the wrap-around.
    dechex(16),
    dechex(-5)  // PHP integers are signed, but this function will convert them to unsigned.
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            '7',
            'a', // Hex digits from 10->15 are represented with letters a->f.
            'f', // Last single digit in hex (base-16).
            '10',
            'fffffffb' // Signed -5 converted to unsigned. JS is only 32-bit, so this differs
                       // from the result you would get from 64-bit Zend PHP (fffffffffffffffb).
        ]);
    });
});
