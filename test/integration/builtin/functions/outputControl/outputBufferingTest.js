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

describe('PHP output buffering integration', function () {
    it('should be able to capture, flush and clear nested output buffers', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// Not flushing - one level deep
ob_start();
print 'One - First' . PHP_EOL;
print 'One - Second';
$result[] = ob_get_clean();

// Not flushing - two levels deep
ob_start();
print 'Two - First (I should be discarded by the ob_end_clean below)' . PHP_EOL;
ob_start();
print 'Two - Second' . PHP_EOL;
$result[] = ob_get_clean(); // Capture and discard inner buffer
ob_end_clean(); // Discard outer buffer

// Flushing and capturing
ob_start();
print 'Flushing - First' . PHP_EOL;
ob_flush();
print 'Flushing - Second' . PHP_EOL;
$result[] = ob_get_contents() . ' & ' . ob_get_contents(); // Check we can fetch it again
ob_start();
print 'Flushing - Third' . PHP_EOL;
ob_end_flush();
$result[] = ob_get_contents();
ob_end_flush();

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'One - First\nOne - Second',
            'Two - Second\n',
            'Flushing - Second\n & Flushing - Second\n',
            'Flushing - Second\nFlushing - Third\n'
        ]);
        expect(engine.getStdout().readAll()).to.equal(nowdoc(function () {/*<<<EOS
Flushing - First
Flushing - Second
Flushing - Third

EOS
        */;})); //jshint ignore:line
    });
});
