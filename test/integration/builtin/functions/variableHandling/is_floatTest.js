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

describe('PHP "is_float" builtin function integration', function () {
    it('should be able to determine whether a value is a float', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$myValidResource = create_my_resource('my_resource_type');

$result['array'] = is_float(['i am' => 'an array']);
$result['boolean'] = is_float(true);
$result['float'] = is_float(123.45);
$result['integer'] = is_float(345);
$result['null'] = is_float(null);
$result['object'] = is_float(new stdClass);
$result['valid resource'] = is_float($myValidResource);
$result['string'] = is_float('I am a string');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();
        engine.defineCoercingFunction('create_my_resource', function (type) {
            return this.valueFactory.createResource(type, {});
        });

        expect((await engine.execute()).getNative()).to.deep.equal({
            'array': false,
            'boolean': false,
            'float': true,
            'integer': false,
            'null': false,
            'object': false,
            'valid resource': false,
            'string': false
        });
    });
});
