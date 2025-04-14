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

describe('PHP "stripos" builtin function integration', function () {
    it('should be able to find the position of a case-insensitive substring', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['basic find'] = stripos('Hello World', 'world');
$result['not found'] = stripos('Hello World', 'xyz');
$result['with positive offset'] = stripos('Hello World Hello', 'hello', 6);
$result['with negative offset'] = stripos('Hello World Hello', 'lo', -15);
$result['empty needle'] = stripos('Hello World', '');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'basic find': 6,
            'not found': false,
            'with positive offset': 12,
            'with negative offset': 3,
            'empty needle': 0
        });
    });
});
