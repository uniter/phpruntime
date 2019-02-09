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

describe('PHP "array_diff" builtin function integration', function () {
    it('should be able to diff two indexed arrays', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myFirstArray = ['one', 'two', 'ten'];
$mySecondArray = [4, 'ten', 'one'];

$result = array_diff($myFirstArray, $mySecondArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            undefined,
            'two'
        ]);
    });

    it('should be able to diff three indexed arrays', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myFirstArray = ['one', 'two', 'ten'];
$mySecondArray = [4, 'three'];
$myThirdArray = ['eleven', 12, 'ten'];

$result = array_diff($myFirstArray, $mySecondArray, $myThirdArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'one',
            'two'
        ]);
    });

    it('should be able to diff two associative arrays', function () {
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
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal({
            'my_first_element': 'one' // Only values are compared, but keys are preserved
        });
    });

    it('should be able to diff two mixed-type arrays', function () {
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
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal({
            'my_first_element': 'one' // Only values are compared, but keys are preserved
        });
    });
});
