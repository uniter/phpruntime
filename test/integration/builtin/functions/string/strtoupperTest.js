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

describe('PHP "strtoupper" builtin function integration', function () {
    it('should be able to uppercase a string', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = strtoupper('this IS My STRing');
$myString = ['my_el' => 'this IS my other STrinG'];
$result[] = strtoupper($myString['my_el']);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'THIS IS MY STRING',
            'THIS IS MY OTHER STRING'
        ]);
    });
});
