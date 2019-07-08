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
    it('should support fetching the original config options from the INI file', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    'cfg_file_path' => get_cfg_var('cfg_file_path')
];
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal({
            'cfg_file_path': '/pseudo/uniter/php.ini'
        });
    });
});
