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

describe('PHP PCRE constants integration', function () {
    it('should support all the PCRE constants', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    'PREG_OFFSET_CAPTURE' => PREG_OFFSET_CAPTURE,
    'PREG_PATTERN_ORDER' => PREG_PATTERN_ORDER,
    'PREG_SET_ORDER' => PREG_SET_ORDER
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'PREG_OFFSET_CAPTURE': 256,
            'PREG_PATTERN_ORDER': 1,
            'PREG_SET_ORDER': 2
        });
    });
});
