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

describe('PHP "spl_object_hash" builtin function integration', function () {
    it('should always generate the same hash for the same object', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$firstObject = new stdClass;
$secondObject = new stdClass;

$result = [];
$result[] = spl_object_hash($firstObject);
$result[] = spl_object_hash($secondObject);
$result[] = spl_object_hash($firstObject);
$result[] = spl_object_hash($secondObject);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            '00000000000000000000000000000001',
            '00000000000000000000000000000002',
            '00000000000000000000000000000001', // Should be the same as the first hash
            '00000000000000000000000000000002'  // Should be the same as the second hash
        ]);
        expect(engine.getStdout().readAll()).to.equal('');
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
