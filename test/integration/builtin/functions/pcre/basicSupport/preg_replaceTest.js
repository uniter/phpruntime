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

describe('PHP "preg_replace" basic-level builtin function integration', function () {
    it('should be able to replace using regexes compatible with both the JS and PCRE formats', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result[] = preg_replace('/dog/', 'cat', 'the dog jumped over the fence');
// Replacing an array of patterns with a single replacement
$result[] = preg_replace(
    [
        '/first/',
        '/SECOND/i'
    ],
    'number',
    'first then second'
);
// Replacing an array of patterns with an array of matching replacements
$result[] = preg_replace(
    [
        '/hel{2}o/',
        '/world/'
    ],
    [
        'goodbye',
        'planet'
    ],
    'hello there world'
);
$result[] = preg_replace(
    [
        '/hel{2}o/',
        '/world/'
    ],
    [
        'goodbye',
        'planet'
    ],
    [
        'hello there world',
        'the world said hello'
    ]
);
$result[] = preg_replace(
    [
        '/a{2}/',
        '/b{2}/'
    ],
    [
        '[from: a]',
        '[from: b]'
    ],
    [
        'aa bb aa bb aa bb aa bb',
        'aaaaaaaabbbbbbbb'
    ],
    3,
    $count
);
$result[] = $count;

$result[] = preg_replace(
    '/hello/',
    'goodbye',
    [
        'first' => 'well hello there',
        'second' => 'anything'
    ]
);

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
            'the cat jumped over the fence',    // Single pattern and single replacement
            'number then number',               // As above, but with case insensitivity modifier
            'goodbye there planet',             // Multiple patterns and replacements for a single subject

            // Multiple patterns and replacements for multiple subjects
            [
                'goodbye there planet',
                'the planet said goodbye'
            ],

            // Setting a limit on no. of replacements, which should be per-pattern per-subject
            [
                '[from: a] [from: b] [from: a] [from: b] [from: a] [from: b] aa bb',
                '[from: a][from: a][from: a]aa[from: b][from: b][from: b]bb'
            ],
            12, // If requested, the count stored should be the total across all subjects' replacements

            // If subject is an _associative_ array, the keys should be preserved
            {
                'first': 'well goodbye there',
                'second': 'anything'
            }
        ]);
    });
});
