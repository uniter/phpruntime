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

describe('PHP "is_file" builtin function integration', function () {
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

    it('should return true for a file that exists', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return is_file('my-file.txt');
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment);

        isFile.withArgs('my-file.txt').returns(true);

        expect((await engine.execute()).getNative()).to.be.true;
    });

    it('should return false for a file that does not exist', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return is_file('/non/existent/file.txt');
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment);

        expect((await engine.execute()).getNative()).to.be.false;
    });

    it('should return false for a directory, even when it does exist', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return is_file('/non/existent/path');
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment);

        isDirectory.withArgs('/non/existent/path').returns(true);

        expect((await engine.execute()).getNative()).to.be.false;
    });
});
