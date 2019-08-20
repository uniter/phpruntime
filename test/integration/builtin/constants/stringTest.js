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

describe('PHP string constants integration', function () {
    it('should support all the string constants', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    HTML_SPECIALCHARS,
    HTML_ENTITIES,

    ENT_NOQUOTES,
    ENT_COMPAT,
    ENT_QUOTES,

    ENT_HTML401,

    ENT_SUBSTITUTE
];
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            0, // HTML_SPECIALCHARS
            1, // HTML_ENTITIES

            0, // ENT_NOQUOTES
            2, // ENT_COMPAT
            3, // ENT_QUOTES

            0, // ENT_HTML401

            8  // ENT_SUBSTITUTE
        ]);
    });
});
