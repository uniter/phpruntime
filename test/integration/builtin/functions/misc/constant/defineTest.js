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

describe('PHP "define" builtin function integration', function () {
    it('should be able to define a case-sensitive constant', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
define('MY_CONST', 21);
define('my_const', 57);
define('My\Namespaced\CONSTANT', 101);
define('My\Namespaced\cONStant', 60); // Note the constant is case-sensitive, not its namespace.

return [
    MY_CONST,
    \My\Namespaced\CONSTANT
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            21,
            101
        ]);
    });

    it('should be able to define a case-insensitive constant', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
define('MY_CONST', 101, true);
define('My\Namespaced\CONSTANT', 21, true);

return [
    mY_cONSt,
    \My\Namespaced\consTANT
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            101,
            21
        ]);
    });
});
