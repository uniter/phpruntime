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

describe('PHP "get_html_translation_table" builtin function integration', function () {
    it('should be able to fetch the various tables', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = get_html_translation_table(); // Should default to htmlspecialchars, ENT_COMPAT | ENT_HTML401, UTF-8

$result[] = get_html_translation_table(HTML_SPECIALCHARS, ENT_COMPAT | ENT_HTML401, 'UTF-8'); // Explicit version

$result[] = get_html_translation_table(HTML_ENTITIES);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            // Defaults
            {
                '"': '&quot;',
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            },

            // Explicitly requesting the defaults
            {
                '"': '&quot;',
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;'
            },

            // Fetching the htmlentities(...) table
            {
                '"': '&quot;',
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',

                '£': '&pound;' // TODO: Add remaining entities via addons
            }
        ]);
    });
});
