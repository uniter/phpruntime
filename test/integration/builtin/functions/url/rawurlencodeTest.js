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

describe('PHP "rawurlencode" builtin function integration', function () {
    it('should be able to encode strings according to RFC 3986', async function () {
        const php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['alphanumeric_only'] = rawurlencode('hello123'); // Alphanumeric characters.
$result['with_space_and_exclamation'] = rawurlencode('hello world!'); // Basic special characters.
$result['multiple_special_chars'] = rawurlencode('Hello World & Goodbye World!'); // Multiple special characters.
$result['unreserved_chars'] = rawurlencode('hello-world_123.456~'); // Hyphen, underscore, dot, and tilde.
$result['unicode_chars'] = rawurlencode('héllö wörld'); // Unicode characters requiring multi-byte encoding.
$result['plus_symbol'] = rawurlencode('hello+world'); // Plus symbol should be encoded as %2B.

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        const result = await engine.execute();

        expect(result.getNative()).to.deep.equal({
            'alphanumeric_only': 'hello123',
            'with_space_and_exclamation': 'hello%20world%21',
            'multiple_special_chars': 'Hello%20World%20%26%20Goodbye%20World%21',
            'unreserved_chars': 'hello-world_123.456~',
            'unicode_chars': 'h%C3%A9ll%C3%B6%20w%C3%B6rld',
            'plus_symbol': 'hello%2Bworld'
        });
    });
});
