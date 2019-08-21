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
    it('should be able to export all supported value types', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$value = true;
$result[] = var_export($value, true);

$value = 21;
$result[] = var_export($value, true);

$value = 101.22;
$result[] = var_export($value, true);

$value = 'hello world';
$result[] = var_export($value, true);

$value = [27, 31];
$result[] = var_export($value, true);

$value = new stdClass;
$result[] = var_export($value, true);

// Skipping "resource" type as we have no support yet

$value = null;
$result[] = var_export($value, true);

// Skipping "unknown type" as we have no support yet (usually returned for closed file descriptors etc.)

// Check that outputting works too
$value = new stdClass;
$result[] = var_export($value);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'true',
            '21',
            '101.22',
            '\'hello world\'',
            'array (\n  0 => 27,\n  1 => 31,\n)',
            'stdClass::__set_state(array(\n))',
            'NULL',
            null // NULL should be returned when outputting
        ]);
        expect(engine.getStdout().readAll()).to.equal('stdClass::__set_state(array(\n))');
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
