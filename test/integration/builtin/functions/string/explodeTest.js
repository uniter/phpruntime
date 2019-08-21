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

// No limit
$result[] = explode(',', '21,101,hello');

// Positive limit
$result[] = explode(',', 'first,second,third,fourth,fifth', 3);

// Negative limit (strip N elements from the end of the array)
$result[] = explode(',', 'first,second,third,fourth,fifth', -2);

// Zero limit (limit of 1)
$result[] = explode(',', 'well,hello,there', 0);

// Positive limit higher than possible elements
$result[] = explode(',', 'first,second', 10);

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
            ['well,hello,there'],
            ['first', 'second']
        ]);
    });
});
