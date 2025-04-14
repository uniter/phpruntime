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

describe('PHP "rawurldecode" builtin function integration', function () {
    it('should be able to decode URL-encoded strings', async function () {
        const php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = rawurldecode('hello world'); // No encoded characters.
$result[] = rawurldecode('hello%20world%21'); // Basic encoding.
$result[] = rawurldecode('%48%65%6C%6C%6F%20%57%6F%72%6C%64'); // All characters encoded.
$result[] = rawurldecode('hello%20world%21%20%26%20goodbye%20world%21'); // Mixed encoded and unencoded.
$result[] = rawurldecode('hello%2world%'); // Invalid encoding.
$result[] = rawurldecode('hello+world'); // Plus symbol should not be decoded to space.

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        const result = await engine.execute();

        expect(result.getNative()).to.deep.equal([
            'hello world',
            'hello world!',
            'Hello World',
            'hello world! & goodbye world!',
            'hello%2world%',
            'hello+world'
        ]);
    });
});
