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
            ]
        ]);
    });
});
