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
    tools = require('../tools'),
    evalPlugin = require('../../../src/plugin/eval');

describe('PHP eval(...) construct integration', function () {
    it('should allow evaluating expressions with access to the calling scope', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myVar = 'out here';

$result = [];

// Check a simple scalar value can be returned
$result[] = eval('return 21;');

// Check that variables in the calling scope can be read from
$result[] = eval('return "and " . $myVar;');

// Check that NULL is returned when `return` is not used
$result[] = eval('new stdClass;');

// Check that variables in the calling scope may be written to
eval('$myVar = "from in here";');
$result[] = $myVar;

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine;

        syncRuntime.install(evalPlugin);
        engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            21,
            'and out here',
            null,
            'from in here'
        ]);
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
