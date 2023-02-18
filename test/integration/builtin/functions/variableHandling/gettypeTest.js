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

describe('PHP "gettype" builtin function integration', function () {
    it('should be able to fetch the type of all the builtin value types', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$value = true;
$result['bool'] = gettype($value);

$value = 21;
$result['int'] = gettype($value);

$value = 101.222;
$result['float'] = gettype($value);

$value = 'hello world';
$result['string'] = gettype($value);

$value = [27, 31];
$result['array'] = gettype($value);

$value = new stdClass;
$result['object'] = gettype($value);

$value = create_my_resource('my_resource_type');
$result['valid resource'] = gettype($value);

$value = null;
$result['null'] = gettype($value);

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
            'bool': 'boolean',
            'int': 'int',
            'float': 'double', // For historical reasons "double" is returned rather than "float".
            'string': 'string',
            'array': 'array',
            'object': 'object',
            'valid resource': 'resource',
            'null': 'NULL'
        });
    });
});
