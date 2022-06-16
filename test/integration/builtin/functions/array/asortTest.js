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

describe('PHP "asort" builtin function integration', function () {
    it('should be able to sort an associative array by value in ascending order', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$array = [
    // Sorting will be by value, not key.
    'amy' => 'D The first element',
    'george' => 'A The second element',
    'fred' => 'C The third element',
    'barry' => 'B The fourth element'
];

asort($array);

var_dump($array);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
array(4) {
  ["george"]=>
  string(20) "A The second element"
  ["barry"]=>
  string(20) "B The fourth element"
  ["fred"]=>
  string(19) "C The third element"
  ["amy"]=>
  string(19) "D The first element"
}

EOS
*/;}) //jshint ignore:line
        );
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
