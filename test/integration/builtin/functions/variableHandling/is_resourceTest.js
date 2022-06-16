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

describe('PHP "is_resource" builtin function integration', function () {
    it('should be able to determine whether a value is a resource', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$myValidResource = create_my_resource('my_resource_type');

$result['array'] = is_resource(['i am' => 'not a resource']);
$result['boolean'] = is_resource(true);
$result['float'] = is_resource(123.45);
$result['integer'] = is_resource(345);
$result['null'] = is_resource(null);
$result['object'] = is_resource(new stdClass);
$result['valid resource'] = is_resource($myValidResource);
$result['string'] = is_resource('I am not a resource');

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
            'valid resource': true,
            'string': false
        });
    });
});
