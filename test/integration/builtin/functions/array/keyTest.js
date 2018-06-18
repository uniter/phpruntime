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

describe('PHP "key" builtin function integration', function () {
    it('should return the current key for an array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myArray = ['first' => 'a', 'second' => 'b', 'third' => 'c', 'fourth' => 'd'];

$result[] = key($myArray);

next($myArray);
$result[] = key($myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'first',
            'second'
        ]);
    });
});
