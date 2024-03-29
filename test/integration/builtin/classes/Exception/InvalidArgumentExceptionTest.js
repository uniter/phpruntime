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

describe('PHP "InvalidArgumentException" builtin class integration', function () {
    it('should extend the LogicException base class', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$exception = new InvalidArgumentException('Oops');

return $exception instanceof LogicException;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.be.true;
    });

    it('should set the message on the Exception', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$exception = new InvalidArgumentException('Oops');

return $exception->getMessage();
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.equal('Oops');
    });
});
