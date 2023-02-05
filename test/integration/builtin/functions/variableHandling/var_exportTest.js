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

describe('PHP "var_export" builtin function integration', function () {
    it('should be able to export all supported value types', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$value = true;
$result['bool'] = var_export($value, true);

$value = 21;
$result['int'] = var_export($value, true);

$value = 101.22;
$result['float'] = var_export($value, true);

$value = 'hello world';
$result['string'] = var_export($value, true);

$value = [27, 31];
$result['array'] = var_export($value, true);

$anotherValue = 21;
$value['with_ref'] =& $anotherValue;
$result['array with ref'] = var_export($value, true);

$value = new stdClass;
$result['object'] = var_export($value, true);

$value = create_my_resource('my_resource_type');
$result['resource'] = var_export($value, true);

$value = null;
$result['null'] = var_export($value, true);

// Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)

// Check that outputting works too.
$value = new stdClass;
$result['when outputting'] = var_export($value);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();
        engine.defineCoercingFunction('create_my_resource', function () {
            return this.valueFactory.createResource('my_resource_type', {});
        });

        expect((await engine.execute()).getNative()).to.deep.equal({
            'bool': 'true',
            'int': '21',
            'float': '101.22',
            'string': '\'hello world\'',
            'array': 'array (\n  0 => 27,\n  1 => 31,\n)',
            'array with ref': 'array (\n  0 => 27,\n  1 => 31,\n  \'with_ref\' => 21,\n)',
            'object': 'stdClass::__set_state(array(\n))',
            'resource': 'NULL', // Resources cannot be exported and so become null.
            'null': 'NULL',
            'when outputting': null
        });
        expect(engine.getStdout().readAll()).to.equal('stdClass::__set_state(array(\n))');
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
