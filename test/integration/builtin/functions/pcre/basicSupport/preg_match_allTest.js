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

describe('PHP "preg_match_all" basic-level builtin function integration', function () {
    it('should be able to search using regexes compatible with both the JS and PCRE formats', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// With default flags (PREG_PATTERN_ORDER)
$result[] = preg_match_all('/a(.)c/', 'start abc axc middle aac end', $matches);
$result[] = $matches;
// Use start-of-string anchor to make sure the offset is not applied by simply stripping off some leading chars
$result[] = preg_match_all('/((?:^1234.*?)?)a(..)d/', 'abcd 1234 axyd then auud', $matches, PREG_PATTERN_ORDER, 5);
$result[] = $matches;

// Test case-insensitive modifier
$result[] = preg_match_all('/m(.n)e/i', 'maNe mInE MynE', $matches);
$result[] = $matches;

// With PREG_SET_ORDER
$result[] = preg_match_all('/a(.)c/', 'start abc axc middle aac end', $matches, PREG_SET_ORDER);
$result[] = $matches;

// With PREG_OFFSET_CAPTURE (and PREG_PATTERN_ORDER, implicitly)
$result[] = preg_match_all('/a(.)c/', 'start abc axc middle aac end', $matches, PREG_OFFSET_CAPTURE);
$result[] = $matches;

// With both PREG_SET_ORDER _and_ PREG_OFFSET_CAPTURE
$result[] = preg_match_all('/a(.)c/', 'start abc axc middle aac end', $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
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
            // PREG_PATTERN_ORDER:

            3,
            // First regex (/a(.)c/)
            [
                // Full matches (&0)
                [
                    'abc',
                    'axc',
                    'aac'
                ],
                // First capturing group (&1)
                [
                    'b',
                    'x',
                    'a'
                ]
            ],
            2,
            // Second regex (/((?:^1234.*?)?)a(..)d/)
            [
                [
                    'axyd',
                    'auud'
                ],
                // 1234-capturing group that shouldn't match anything
                [
                    '',
                    ''
                ],
                [
                    'xy',
                    'uu'
                ]
            ],
            3,
            // Third regex (/m(.n)e/i)
            [
                [
                    'maNe',
                    'mInE',
                    'MynE'
                ],
                [
                    'aN',
                    'In',
                    'yn'
                ]
            ],

            // PREG_SET_ORDER:

            3,
            [
                [
                    'abc',
                    'b'
                ],
                [
                    'axc',
                    'x'
                ],
                [
                    'aac',
                    'a'
                ]
            ],

            // PREG_OFFSET_CAPTURE

            3,
            [
                [
                    ['abc', 6],
                    ['axc', 10],
                    ['aac', 21]
                ],
                [
                    ['b', 7],
                    ['x', 11],
                    ['a', 22]
                ]
            ],

            // PREG_SET_ORDER | PREG_OFFSET_CAPTURE

            3,
            [
                [
                    ['abc', 6],
                    ['b', 7]
                ],
                [
                    ['axc', 10],
                    ['x', 11]
                ],
                [
                    ['aac', 21],
                    ['a', 22]
                ]
            ]
        ]);
    });
});
