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
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    sinon = require('sinon'),
    syncPHPRuntime = require('../../../../../sync');

describe('PHP "file_exists" builtin function integration', function () {
    beforeEach(function () {
        this.isDirectory = sinon.stub();
        this.isFile = sinon.stub();
        this.fileSystem = {
            isDirectory: this.isDirectory,
            isFile: this.isFile
        };
        this.isDirectory.returns(false);
        this.isFile.returns(false);
    });

    it('should return true for a file or directory that exists', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return [
    file_exists('my-file.txt'),
    file_exists('/path/to/my-dir')
];
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            engine = module({
                'fileSystem': this.fileSystem
            });

        this.isFile.withArgs('my-file.txt').returns(true);
        this.isDirectory.withArgs('/path/to/my-dir').returns(true);

        expect(engine.execute().getNative()).to.deep.equal([
            true,
            true
        ]);
    });

    it('should return false for a file or directory that does not exist', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return file_exists('/non/existent/dir');
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            engine = module({
                'fileSystem': this.fileSystem
            });

        expect(engine.execute().getNative()).to.be.false;
    });
});
