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

describe('PHP "end" builtin function integration', function () {
    it('should support both empty and populated arrays', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myFirstArray = ['first', 21];
$mySecondArray = [1 => 'one', 0 => 'zero']; // Order should be as defined, not numeric

$result[] = end($myFirstArray);
$result[] = end($mySecondArray);
$result[] = end([]);
$result[] = current($myFirstArray);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            21,
            'zero', // Order should be as defined, not numeric
            false,  // False should be returned for an empty array
            21      // Internal pointer of $myFirstArray should have been moved to the end
        ]);
    });
});
