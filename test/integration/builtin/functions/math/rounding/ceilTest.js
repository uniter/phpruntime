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

describe('PHP "ceil" builtin function integration', function () {
    it('should be able to round fractions up', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['positive integer'] = ceil(123);
$result['negative integer'] = ceil(-321);
$result['positive float'] = ceil(123.456);
$result['negative float'] = ceil(-321.789);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'positive integer': 123,
            'negative integer': -321,
            'positive float': 124,
            'negative float': -321
        });
    });
});
