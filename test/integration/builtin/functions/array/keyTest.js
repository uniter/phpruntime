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

describe('PHP "key" builtin function integration', function () {
    it('should return the current key for an array', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myArray = ['first' => 'a', 'second' => 'b', 'third' => 'c', 'fourth' => 'd'];

$result['first key'] = key($myArray);

next($myArray);
$result['second key'] = key($myArray);

end($myArray);
next($myArray);
$result['past end of array'] = key($myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'first key': 'first',
            'second key': 'second',
            'past end of array': null
        });
    });

    it('should return the current key for an object', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$myObject = (object)['first' => 'a', 'second' => 'b', 'third' => 'c', 'fourth' => 'd'];

$result['first key'] = key($myObject);

next($myObject);
$result['second key'] = key($myObject);

end($myObject);
next($myObject);
$result['past end of object'] = key($myObject);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'first key': 'first',
            'second key': 'second',
            'past end of object': null
        });
    });
});
