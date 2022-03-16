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

describe('PHP "implode" builtin function integration', function () {
    it('should be able to join strings together', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$myArray = ['first', 'second', 'third'];
$result['with array of strings and delimiter'] = implode('@', $myArray);
$result['with array of strings, delimiter and args in reverse order'] = implode($myArray, '@');

class MyClass {
    public function __toString() {
        return '{my object}';
    }
}

$myObject = new MyClass;
$myArray = ['my string', $myObject];
$result['with array of string, stringifiable object and delimiter'] = implode(' -OBJ- ', $myArray);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal({
            'with array of strings and delimiter': 'first@second@third',
            // Note that this legacy signature was deprecated as of PHP v7.4.0 and removed as of PHP v8.0.0.
            'with array of strings, delimiter and args in reverse order': 'first@second@third',
            // Note that __toString() will be called for this one.
            'with array of string, stringifiable object and delimiter': 'my string -OBJ- {my object}'
        });
    });
});
