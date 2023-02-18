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

describe('PHP filesystem constants integration', function () {
    it('should support all the filesystem constants', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    'DIRECTORY_SEPARATOR' => DIRECTORY_SEPARATOR,
    'PATH_SEPARATOR' => PATH_SEPARATOR
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'DIRECTORY_SEPARATOR': '/',
            'PATH_SEPARATOR': ':'
        });
    });
});
