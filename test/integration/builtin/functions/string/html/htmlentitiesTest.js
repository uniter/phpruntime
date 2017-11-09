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
    tools = require('../../../../tools');

describe('PHP "htmlentities" builtin function integration', function () {
    it('should be able to encode a string', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = htmlentities('My <strong>HTML</strong> string');

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'My &lt;strong&gt;HTML&lt;/strong&gt; string'
        ]);
    });
});
