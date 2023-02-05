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
    sinon = require('sinon'),
    tools = require('../../../tools');

describe('PHP "file_exists" builtin function integration', function () {
    var environment,
        fileSystem,
        isDirectory,
        isFile;

    beforeEach(function () {
        isDirectory = sinon.stub();
        isFile = sinon.stub();
        fileSystem = {
            isDirectory: isDirectory,
            isFile: isFile
        };

        environment = tools.createAsyncEnvironment({
            'fileSystem': fileSystem
        });

        isDirectory.returns(false);
        isFile.returns(false);
    });

    it('should return true for a file or directory that exists', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    file_exists('my-file.txt'),
    file_exists('/path/to/my-dir')
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment);

        isFile.withArgs('my-file.txt').returns(true);
        isDirectory.withArgs('/path/to/my-dir').returns(true);

        expect((await engine.execute()).getNative()).to.deep.equal([
            true,
            true
        ]);
    });

    it('should return false for a file or directory that does not exist', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return file_exists('/non/existent/dir');
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment);

        expect((await engine.execute()).getNative()).to.be.false;
    });
});
