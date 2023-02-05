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

describe('PHP "is_numeric" builtin function integration', function () {
    it('should only return true for numeric values', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$value = true;
$result['bool'] = is_numeric($value);

$value = 21;
$result['int'] = is_numeric($value);

$value = 0x539;
$result['hexadecimal literal'] = is_numeric($value);

$value = 02471;
$result['octal literal'] = is_numeric($value);

$value = 0b10100111001;
$result['binary literal'] = is_numeric($value);

$value = 1337e0;
$result['integer literal with exponent'] = is_numeric($value);

$value = '0x539';
$result['hexadecimal literal as string'] = is_numeric($value);

$value = '02471';
$result['octal literal as string'] = is_numeric($value);

$value = '0b10100111001';
$result['binary literal as string'] = is_numeric($value);

$value = '1337e0';
$result['integer literal with exponent as string'] = is_numeric($value);

$value = 101.222;
$result['float'] = is_numeric($value);

$value = 'hello world';
$result['non-numeric string'] = is_numeric($value);

$value = '456';
$result['numeric string'] = is_numeric($value);

$value = [27, 31];
$result['array of numbers'] = is_numeric($value);

$value = new stdClass;
$result['stdClass instance'] = is_numeric($value);

$value = create_my_resource('my_resource_type');
$result['valid resource'] = is_numeric($value);

$value = null;
$result['null'] = is_numeric($value);

// Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();
        engine.defineCoercingFunction('create_my_resource', function (type) {
            return this.valueFactory.createResource(type, {});
        });

        expect((await engine.execute()).getNative()).to.deep.equal({
            'bool': false,
            'int': true,
            'hexadecimal literal': true,
            'octal literal': true,
            'binary literal': true,
            'integer literal with exponent': true,
            'hexadecimal literal as string': false,
            'octal literal as string': true,
            'binary literal as string': false,
            'integer literal with exponent as string': true,
            'float': true,
            'non-numeric string': false,
            'numeric string': true,
            'array of numbers': false,
            'stdClass instance': false,
            'valid resource': false,
            'null': false
        });
    });
});
