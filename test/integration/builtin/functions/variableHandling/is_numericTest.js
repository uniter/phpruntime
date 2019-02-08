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
    it('should only return true for numeric values', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$value = true;
$result[] = is_numeric($value);

$value = 21;
$result[] = is_numeric($value);

$value = 101.222;
$result[] = is_numeric($value);

$value = 'hello world';
$result[] = is_numeric($value);

$value = '456';
$result[] = is_numeric($value);

$value = [27, 31];
$result[] = is_numeric($value);

$value = new stdClass;
$result[] = is_numeric($value);

// Skipping "resource" type as we have no support yet

$value = null;
$result[] = is_numeric($value);

// Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php);

        expect(module().execute().getNative()).to.deep.equal([
            false, // Boolean
            true,  // Integer
            true,  // Float
            false, // Non-numeric string
            true, // Numeric string
            false, // Array
            false, // stdClass instance
            false  // Null
        ]);
    });
});
