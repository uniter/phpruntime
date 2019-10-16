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
    it('should support all the PCRE constants', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    PREG_OFFSET_CAPTURE,
    PREG_PATTERN_ORDER,
    PREG_SET_ORDER
];
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            256, // PREG_OFFSET_CAPTURE
            1,   // PREG_PATTERN_ORDER
            2    // PREG_SET_ORDER
        ]);
    });
});
