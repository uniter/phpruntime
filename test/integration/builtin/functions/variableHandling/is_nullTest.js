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

describe('PHP "is_null" builtin function integration', function () {
    it('should be able to determine whether a value is null', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$myValidResource = create_my_resource('my_resource_type');

$result['array'] = is_null(['i am' => 'an array']);
$result['boolean'] = is_null(true);
$result['float'] = is_null(123.45);
$result['integer'] = is_null(345);
$result['null'] = is_null(null);
$result['object'] = is_null(new stdClass);
$result['valid resource'] = is_null($myValidResource);
$result['string'] = is_null('I am a string');

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
            'null': true,
            'object': false,
            'valid resource': false,
            'string': false
        });
    });
});
