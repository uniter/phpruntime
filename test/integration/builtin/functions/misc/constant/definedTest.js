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

describe('PHP "defined" builtin function integration', function () {
    it('should be able to detect a case-sensitive constant', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
define('MY_CONST', 21);
define('My\Namespaced\Constant', 101);

return [
    defined('MY_CONST'),
    defined('my_CoNst'),
    defined('My\Namespaced\Constant'),
    defined('My\Namespaced\cONstanT') // Note the constant is case-sensitive, not its namespace.
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            // Global namespaced:
            true,
            false, // Wrong case, no match.

            // Namespaced:
            true,
            false  // Wrong case, no match.
        ]);
    });

    it('should be able to detect a case-insensitive constant', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
define('MY_CONST', 21, true);
define('My\Namespaced\Constant', 101, true);

return [
    defined('MY_CONST'),
    defined('my_CoNst'),
    defined('My\Namespaced\Constant'),
    defined('my\NAMESPACED\Constant')
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            // Global namespaced:
            true,
            true, // Case-insensitive version should still match.

            // Namespaced:
            true,
            true  // Same for the namespaced one.
        ]);
    });
});
