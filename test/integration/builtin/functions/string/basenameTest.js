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

describe('PHP "basename" builtin function integration', function () {
    it('should be able to extract the basename from a path', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['simple path'] = basename('/path/to/my/file.txt');
$result['no path'] = basename('file.txt');
$result['with suffix'] = basename('/path/to/my/file.txt', '.txt');
$result['with suffix not matching'] = basename('/path/to/my/file.txt', '.php');
$result['with suffix matching but not at end'] = basename('/path/to/my/file.txt.txt', '.txt');
$result['empty path'] = basename('');
$result['path with trailing slash'] = basename('/path/to/my/');
$result['path with multiple trailing slashes'] = basename('/path/to/my///');
$result['path with dots'] = basename('/path/to/my.dir/file.txt');
$result['multiple dots'] = basename('/path/to/my/file.name.with.dots.txt');
$result['special chars'] = basename('/path/to/my/file@#$%^&*().txt');
$result['unicode chars'] = basename('/path/to/my/文件.txt');
$result['windows style path'] = basename('C:\\path\\to\\file.txt');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'simple path': 'file.txt',
            'no path': 'file.txt',
            'with suffix': 'file',
            'with suffix not matching': 'file.txt',
            'with suffix matching but not at end': 'file.txt',
            'empty path': '',
            'path with trailing slash': '',
            'path with multiple trailing slashes': '',
            'path with dots': 'file.txt',
            'multiple dots': 'file.name.with.dots.txt',
            'special chars': 'file@#$%^&*().txt',
            'unicode chars': '文件.txt',
            'windows style path': 'C:\\path\\to\\file.txt'
        });
    });
});
