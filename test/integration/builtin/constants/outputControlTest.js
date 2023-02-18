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

describe('PHP output control constants integration', function () {
    it('should support all the output control constants', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    'PHP_OUTPUT_HANDLER_CLEANABLE' => PHP_OUTPUT_HANDLER_CLEANABLE,
    'PHP_OUTPUT_HANDLER_FLUSHABLE' => PHP_OUTPUT_HANDLER_FLUSHABLE,
    'PHP_OUTPUT_HANDLER_REMOVABLE' => PHP_OUTPUT_HANDLER_REMOVABLE,
    'PHP_OUTPUT_HANDLER_STDFLAGS' => PHP_OUTPUT_HANDLER_STDFLAGS
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'PHP_OUTPUT_HANDLER_CLEANABLE': 16,
            'PHP_OUTPUT_HANDLER_FLUSHABLE': 32,
            'PHP_OUTPUT_HANDLER_REMOVABLE': 64,
            'PHP_OUTPUT_HANDLER_STDFLAGS': 112
        });
    });
});
