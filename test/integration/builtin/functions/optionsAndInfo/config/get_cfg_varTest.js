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
    phpCommon = require('phpcommon'),
    tools = require('../../../../tools'),
    Exception = phpCommon.Exception;

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

    it('should throw a meaningful error when an unsupported option is provided', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

get_cfg_var('some_other_setting');
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            Exception,
            'Cannot fetch option "some_other_setting" - only cfg_file_path config option is currently supported'
        );
    });
});
