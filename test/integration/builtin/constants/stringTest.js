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
    it('should support all the string constants', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    'HTML_SPECIALCHARS' => HTML_SPECIALCHARS,
    'HTML_ENTITIES' => HTML_ENTITIES,

    'ENT_NOQUOTES' => ENT_NOQUOTES,
    'ENT_COMPAT' => ENT_COMPAT,
    'ENT_QUOTES' => ENT_QUOTES,

    'ENT_HTML401' => ENT_HTML401,

    'ENT_SUBSTITUTE' => ENT_SUBSTITUTE
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'HTML_SPECIALCHARS': 0,
            'HTML_ENTITIES': 1,

            'ENT_NOQUOTES': 0,
            'ENT_COMPAT': 2,
            'ENT_QUOTES': 3,

            'ENT_HTML401': 0,

            'ENT_SUBSTITUTE': 8
        });
    });
});
