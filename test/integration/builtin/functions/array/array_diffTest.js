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

describe('PHP "array_diff" builtin function integration', function () {
    it('should be able to diff two indexed arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myFirstArray = ['one', 'two', 'ten'];
$mySecondArray = [4, 'ten', 'one'];

$result = array_diff($myFirstArray, $mySecondArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            undefined,
            'two'
        ]);
    });

    it('should be able to diff three indexed arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myFirstArray = ['one', 'two', 'ten'];
$mySecondArray = [4, 'three'];
$myThirdArray = ['eleven', 12, 'ten'];

$result = array_diff($myFirstArray, $mySecondArray, $myThirdArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'one',
            'two'
        ]);
    });

    it('should be able to diff two associative arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myFirstArray = [
    'my_first_element' => 'one',
    'my_second_element' => 'two',
    'our_third_element' => 'three'
];
$mySecondArray = [
    'your_first_element' => 'two',
    'your_second_element' => 'seven',
    'our_third_element' => 'three'
];

$result = array_diff($myFirstArray, $mySecondArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'my_first_element': 'one' // Only values are compared, but keys are preserved.
        });
    });

    it('should be able to diff two mixed-type arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myFirstArray = [
    'my_first_element' => 'one',
    'my_second_element' => 'two',
    'our_third_element' => 'three'
];
$mySecondArray = [
    'two',
    'seven',
    'three'
];

$result = array_diff($myFirstArray, $mySecondArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'my_first_element': 'one' // Only values are compared, but keys are preserved.
        });
    });

    // Since PHP v8.0.0, a single array may be given.
    it('should just return the array when given only a single array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return array_diff(['one', 'two']);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal(['one', 'two']);
    });

    it('should raise an error when one of the arguments is not an array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

array_diff(['one', 'two'], ['three'], 456);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            PHPFatalError,
            'PHP Fatal error: Uncaught TypeError: array_diff(): Argument #3 must be of type array, int given ' +
            'in /path/to/my_module.php:3' +
            // NB: Extraneous context info here is added by PHPFatalError (PHPError),
            //     but not output to stdout/stderr.
            ' in /path/to/my_module.php on line 3'
        );
    });
});
