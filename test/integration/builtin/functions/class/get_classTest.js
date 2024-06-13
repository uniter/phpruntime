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
    phpCommon = require('phpcommon'),
    tools = require('../../../tools'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('PHP "get_class" builtin function integration', function () {
    it('should be able to fetch both the current class and the class of a specified object', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

namespace My\Space
{
    class FirstClass {
    }

    class SecondClass
    {
        public function getItsClass()
        {
            return get_class(); // With no arguments, should fetch the current FQCN.
        }
    }
}

namespace {
    $firstObject = new My\Space\FirstClass;
    $secondObject = new My\Space\SecondClass;

    $result = [];
    $result[] = get_class($firstObject);
    $result[] = $secondObject->getItsClass();

    return $result;
}
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'My\\Space\\FirstClass',
            'My\\Space\\SecondClass'
        ]);
    });

    it('should raise a fatal error when called with no arguments outside a class', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

get_class();
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            PHPFatalError,
            'PHP Fatal error: Uncaught Error: get_class() without arguments must be called from within a class ' +
            'in /path/to/my_module.php on line 3'
        );
    });

    it('should raise a fatal error when called with a non-null non-object', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

get_class(21);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            PHPFatalError,
            'PHP Fatal error: Uncaught TypeError: get_class(): Argument #1 ($object) must be of type object, int given ' +
            'in /path/to/my_module.php:3' +
            // NB: Extraneous context info here is added by PHPFatalError (PHPError),
            //     but not output to stdout/stderr.
            ' in /path/to/my_module.php on line 3'
        );
    });

    it('should raise a fatal error when called with null', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

get_class(null);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            PHPFatalError,
            'PHP Fatal error: Uncaught TypeError: get_class(): Argument #1 ($object) must be of type object, null given ' +
            'in /path/to/my_module.php:3' +
            // NB: Extraneous context info here is added by PHPFatalError (PHPError),
            //     but not output to stdout/stderr.
            ' in /path/to/my_module.php on line 3'
        );
    });
});
