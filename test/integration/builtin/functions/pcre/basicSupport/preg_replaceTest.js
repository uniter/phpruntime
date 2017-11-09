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
$result[] = preg_replace(
    [
        '/first/',
        '/second/'
    ],
    'number',
    'first then second'
);
$result[] = preg_replace(
    [
        '/hello/',
        '/world/'
    ],
    [
        'goodbye',
        'planet'
    ],
    'hello there world'
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
            'the cat jumped over the fence',
            'number then number',
            'goodbye there planet'
        ]);
    });
});
