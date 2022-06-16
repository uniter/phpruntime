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

describe('PHP "array_search" builtin function integration', function () {
    it('should be able to find values in an array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$myArray = ['first', 'second', 'my_key' => 'third', 21, 'second'];

$result['indexed, multiple instances, strict matches, loose comparison'] = array_search('second', $myArray);
$result['indexed, single instance, loose match, loose comparison'] = array_search('21', $myArray);
$result['indexed, single instance, strict match, strict comparison'] = array_search('third', $myArray, true);
$result['indexed, single instance, loose match, but strict comparison'] = array_search('21', $myArray, true);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'indexed, multiple instances, strict matches, loose comparison': 1,
            'indexed, single instance, loose match, loose comparison': 2,
            'indexed, single instance, strict match, strict comparison': 'my_key',
            'indexed, single instance, loose match, but strict comparison': false // No match.
        });
    });
});
