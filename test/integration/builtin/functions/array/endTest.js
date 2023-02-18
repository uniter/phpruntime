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

describe('PHP "end" builtin function integration', function () {
    it('should support both empty and populated arrays', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myFirstArray = ['first', 21];
$mySecondArray = [1 => 'one', 0 => 'zero']; // Order should be as defined, not numeric.

$result['end first array'] = end($myFirstArray);
$result['end second array'] = end($mySecondArray);
$myUnrelatedArray = [];
$result['end unrelated empty array'] = end($myUnrelatedArray);
$result['current first array'] = current($myFirstArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'end first array': 21,
            // Order should be as defined, not numeric.
            'end second array': 'zero',
            // False should be returned for an empty array.
            'end unrelated empty array': false,
            // Internal pointer of $myFirstArray should have been moved to the end.
            'current first array': 21
        });
    });

    it('should support both empty and populated objects', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myFirstObject = (object)['first', 21];
$mySecondObject = (object)[1 => 'one', 0 => 'zero']; // Order should be as defined, not numeric.

$result['end first object'] = end($myFirstObject);
$result['end second object'] = end($mySecondObject);
$myUnrelatedObject = [];
$result['end unrelated empty object'] = end($myUnrelatedObject);
$result['current first object'] = current($myFirstObject);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'end first object': 21,
            // Order should be as defined, not numeric.
            'end second object': 'zero',
            // False should be returned for an empty object.
            'end unrelated empty object': false,
            // Internal pointer of $myFirstObject should have been moved to the end.
            'current first object': 21
        });
    });
});
