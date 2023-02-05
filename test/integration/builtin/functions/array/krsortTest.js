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

describe('PHP "krsort" builtin function integration', function () {
    it('should be able to sort an associative array by key in reverse order', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$array = [
    'amy' => 'The first element',
    'george' => 'The second element',
    'fred' => 'The third element',
    'barry' => 'The fourth element'
];

krsort($array);

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
  string(18) "The second element"
  ["fred"]=>
  string(17) "The third element"
  ["barry"]=>
  string(18) "The fourth element"
  ["amy"]=>
  string(17) "The first element"
}

EOS
*/;}) //jshint ignore:line
        );
    });
});
