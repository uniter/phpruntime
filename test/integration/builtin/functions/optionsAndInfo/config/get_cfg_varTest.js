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

describe('PHP "get_cfg_var" builtin function integration', function () {
    it('should support fetching the original config options from the INI file', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    'cfg_file_path' => get_cfg_var('cfg_file_path')
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'cfg_file_path': '/pseudo/uniter/php.ini'
        });
    });

    it('should return false when an unsupported option is provided', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    'result' => get_cfg_var('some_other_setting')
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'result': false
        });
    });
});
