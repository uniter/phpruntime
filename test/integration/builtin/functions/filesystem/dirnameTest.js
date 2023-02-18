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
    tools = require('../../../tools');

describe('PHP "dirname" builtin function integration', function () {
    it('should be able to extract the parent or an ancestor directory path', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['empty string, default 1 level'] = dirname('');
$result['root path, default 1 level'] = dirname('/');
$result['single file or directory name only, default 1 level'] = dirname('my_file_or_dir');
$result['complex path, default 1 level'] = dirname('/my/path/to/my_file');
$result['complex path, explicit 2 levels'] = dirname('/my/path/to/my_file', 2);
$result['complex path with duplicate slashes, explicit 2 levels'] = dirname('/my//path/to//my_file', 2);
$result['complex path, levels exceeding depth'] = dirname('/my/path/to/my_file', 10);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'empty string, default 1 level': '', // Note empty string is preserved.
            'root path, default 1 level': '/',
            'single file or directory name only, default 1 level': '.', // Note current-dir ".".
            'complex path, default 1 level': '/my/path/to', // Note no trailing slash.
            'complex path, explicit 2 levels': '/my/path',
            'complex path with duplicate slashes, explicit 2 levels': '/my//path',
            'complex path, levels exceeding depth': '/' // Stops at root dir.
        });
    });
});
