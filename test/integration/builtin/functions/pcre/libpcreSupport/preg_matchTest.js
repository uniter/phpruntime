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
    libpcreSupportExtension = require('../../../../../../src/builtin/functions/pcre/libpcreSupport');

describe('PHP "preg_match" full libpcre-level builtin function integration', function () {
    it('should be able to search using basic regexes compatible with both the JS and PCRE formats', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = preg_match('/t(e[xs])t/', 'this is a test', $matches);
$result[] = $matches;
$result[] = preg_match('/[ad]c/', 'this is ac and dc');
$result[] = preg_match('/thiswontmatchanything/', 'my text', $matches);
$result[] = $matches;
// Use (?!^) to make sure the offset is not applied by simply stripping off some leading chars
$result[] = preg_match('/((?:^1234.*?)?)a(..)d/', 'abcd 1234 axyd', $matches, 0, 5);
$result[] = $matches;
$result[] = preg_match('/he(l)\1o/', 'intro hello world', $matches, 0, 4);
$result[] = $matches;

// Test case-insensitive modifier
$result[] = preg_match('/m(.n)e/i', 'mInE', $matches);
$result[] = $matches;

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine;

        syncRuntime.install({
            functionGroups: [
                libpcreSupportExtension
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
            ]
        ]);
    });

    it('should be able to search using PCRE-only (non-JS) regex features', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// Test lookbehind support
$result[] = preg_match('/tex(?<=(e\w))t/', 'text', $matches);
$result[] = $matches;

// Test recursive regex support
$result[] = preg_match('/w(orl?)d (w(?1)d)/', 'world word', $matches);
$result[] = $matches;

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine;

        syncRuntime.install({
            functionGroups: [
                libpcreSupportExtension
            ]
        });
        engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            1, // Lookbehind
            [
                'text',
                'ex'
            ],

            1, // Recursion
            [
                'world word',
                'orl',
                'word'
            ]
        ]);
    });
});
