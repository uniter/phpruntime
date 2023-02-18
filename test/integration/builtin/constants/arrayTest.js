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
    tools = require('../../tools');

describe('PHP array constants integration', function () {
    it('should support all the array constants', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    'COUNT_NORMAL' => COUNT_NORMAL,
    'COUNT_RECURSIVE' => COUNT_RECURSIVE,

    'SORT_REGULAR' => SORT_REGULAR,
    'SORT_STRING' => SORT_STRING,
    'SORT_NATURAL' => SORT_NATURAL
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'COUNT_NORMAL': 0,
            'COUNT_RECURSIVE': 1,

            'SORT_REGULAR': 0,
            'SORT_STRING': 2,
            'SORT_NATURAL': 6
        });
    });
});
