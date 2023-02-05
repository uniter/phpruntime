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

describe('PHP "is_string" builtin function integration', function () {
    it('should be able to determine whether a value is a string', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$myValidResource = create_my_resource('my_resource_type');

$result['array'] = is_string(['i am' => 'not a resource']);
$result['boolean'] = is_string(true);
$result['float'] = is_string(123.45);
$result['integer'] = is_string(345);
$result['null'] = is_string(null);
$result['object'] = is_string(new stdClass);
$result['valid resource'] = is_string($myValidResource);
$result['string'] = is_string('I am not a resource');

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
            'float': false,
            'integer': false,
            'null': false,
            'object': false,
            'valid resource': false,
            'string': true
        });
    });
});
