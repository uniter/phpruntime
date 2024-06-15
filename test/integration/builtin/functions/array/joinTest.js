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

describe('PHP "join" builtin function integration (alias of implode())', function () {
    it('should be able to join strings together', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$myArray = ['first', 'second', 'third'];
$result['with array of strings and delimiter'] = join('@', $myArray);

class MyClass {
    public function __toString() {
        return '{my object}';
    }
}

$myObject = new MyClass;
$myArray = ['my string', $myObject];
$result['with array of string, stringifiable object and delimiter'] = join(' -OBJ- ', $myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'with array of strings and delimiter': 'first@second@third',
            // Note that __toString() will be called for this one.
            'with array of string, stringifiable object and delimiter': 'my string -OBJ- {my object}'
        });
    });

    it('should raise a TypeError when the deprecated & removed legacy signature is used', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$myArray = ['first', 'second', 'third'];

// Note that this legacy signature was deprecated as of PHP v7.4.0 and removed as of PHP v8.0.0.
join($myArray, '@');

EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            PHPFatalError,
            /*
             * Note that technically this should be
             * "Uncaught TypeError: join(): Argument #2 ($array) must be of type ?array, string given"
             * to match the reference implementation, for some reason.
             */
            'PHP Fatal error: Uncaught TypeError: join(): Argument #1 ($separator) must be of type string, ' +
            'array given in /path/to/my_module.php:8'
        );
    });
});
