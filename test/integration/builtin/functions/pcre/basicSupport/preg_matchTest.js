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
    tools = require('../../../../tools'),
    basicSupportExtension = require('../../../../../../src/builtin/functions/pcre/basicSupport');

describe('PHP "preg_match" basic-level builtin function integration', function () {
    it('should be able to search using regexes compatible with both the JS and PCRE formats', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// With default flags (PREG_PATTERN_ORDER)
$result[] = preg_match('/t(e[xs])t/', 'this is a test', $matches);
$result[] = $matches;
$result[] = preg_match('/[ad]c/', 'this is ac and dc');
$result[] = preg_match('/thiswontmatchanything/', 'my text', $matches);
$result[] = $matches;
// Use start-of-string anchor to make sure the offset is not applied by simply stripping off some leading chars
$result[] = preg_match('/((?:^1234.*?)?)a(..)d/', 'abcd 1234 axyd', $matches, PREG_PATTERN_ORDER, 5);
$result[] = $matches;
$result[] = preg_match('/he(l)\1o/', 'intro hello world', $matches, PREG_PATTERN_ORDER, 4);
$result[] = $matches;

// Test case-insensitive modifier
$result[] = preg_match('/m(.n)e/i', 'mInE', $matches);
$result[] = $matches;

// Test start-of-string-anchor modifier
$result[] = preg_match('/he..o/A', 'hello world hello world', $matches, null, 12);
$result[] = $matches;

// Test dotall modifier
$result[] = preg_match('/h[e.]l.o w.rld/s', "hel\no world", $matches);
$result[] = $matches;

// With PREG_OFFSET_CAPTURE (and PREG_PATTERN_ORDER, implicitly)
$result[] = preg_match('/he(l)\1o/', 'intro hello world', $matches, PREG_OFFSET_CAPTURE, 4);
$result[] = $matches;

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine;

        syncRuntime.install({
            functionGroups: [
                basicSupportExtension
            ]
        });
        engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            1,
            [
                'test',
                'es'
            ],
            1,  // Two matches, but only either 0 or 1 is returned
            0,  // No match (/thiswontmatchanything/)
            [], // Check matches array is left empty after no match
            1,  // One match, "axyd" after the specified offset 5
            [
                'axyd',
                '',
                'xy'
            ],
            1, // One match ("intro hello world"), checks backreference support
            [
                'hello',
                'l'
            ],
            1, // Case-insensitive modifier
            [
                'mInE',
                'In'
            ],
            1, // Start-of-string-anchor modifier
            [
                'hello'
            ],
            1, // Dotall modifier
            [
                'hel\no world'
            ],
            1,
            [
                ['hello', 6],
                ['l', 8]
            ]
        ]);
    });
});
