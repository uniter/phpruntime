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

describe('PHP "substr_count" builtin function integration', function () {
    it('should be able to count the number of times a substring appears in another string', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// A single occurrence
$result[] = substr_count('my string to search in', 'to');

// Multiple occurrences
$result[] = substr_count('mymymymymymy', 'my');

// With offset and length, where offset+length cuts into a subsequent occurrence that should be discounted
$result[] = substr_count('the the the the the', 'the', 4, 9);

// Negative offset (should start 15 chars from the end, as 'with with words')
$result[] = substr_count('this is a string with with with words', 'with', -15);

// Negative length (should start 7 chars from the end)
$result[] = substr_count('this is a string with with with words', 'with', 19, -7);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            1, // 'my string to search in'
            6, // 'mymymymymymy'
            2, // 'the the t' (offset and length applied)
            2, // 'with with words' (negative offset applied)
            1  // 'th with wit' (negative length applied)
        ]);
    });
});
