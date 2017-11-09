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

describe('PHP "explode" builtin function integration', function () {
    it('should be able to split a string on a delimiter', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = explode(',', '21,101,hello');
$result[] = explode(',', 'first,second,third,fourth,fifth', 3);
$result[] = explode(',', 'first,second,third,fourth,fifth', -2);
$result[] = explode(',', 'well,hello,there', 0);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            ['21', '101', 'hello'],
            ['first', 'second', 'third,fourth,fifth'],
            ['first', 'second', 'third'],
            ['well,hello,there']
        ]);
    });
});
