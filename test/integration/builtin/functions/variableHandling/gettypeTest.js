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
    it('should be able to fetch the type of all the builtin value types', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$value = true;
$result[] = gettype($value);

$value = 21;
$result[] = gettype($value);

$value = 101.222;
$result[] = gettype($value);

$value = 'hello world';
$result[] = gettype($value);

$value = [27, 31];
$result[] = gettype($value);

$value = new stdClass;
$result[] = gettype($value);

// Skipping "resource" type as we have no support yet

$value = null;
$result[] = gettype($value);

// Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php);

        expect(module().execute().getNative()).to.deep.equal([
            'boolean',
            'int',
            'double', // For historical reasons "double" is returned rather than "float"
            'string',
            'array',
            'object',
            'NULL'
        ]);
    });
});
