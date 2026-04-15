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

describe('PHP "serialize" builtin function integration', function () {
    it('should serialize objects with private and protected properties using null-byte encoding', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

class Account {
    private $password;
    protected $balance;
    public $username;

    public function __construct($username, $password, $balance) {
        $this->username = $username;
        $this->password = $password;
        $this->balance = $balance;
    }
}

$account = new Account('alice', 'secret', 100);

$result = [
    'serialized' => serialize($account)
];

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'serialized': 'O:7:"Account":3:{s:17:"\u0000Account\u0000password";s:6:"secret";s:10:"\u0000*\u0000balance";i:100;s:8:"username";s:5:"alice";}'
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should serialize circular object self-references as r:N back-references', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$obj = new stdClass();
$obj->self = $obj;

$result = serialize($obj);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        // The self-reference should be encoded as r:1 (back-reference to the 1st value, the object itself).
        expect((await engine.execute()).getNative()).to.equal('O:8:"stdClass":1:{s:4:"self";r:1;}');
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should serialize mutual object references correctly', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$a = new stdClass();
$b = new stdClass();
$a->b = $b;
$b->a = $a;

$result = serialize($a);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        // $a is position 1. When $b serializes its ->a property, it emits r:1 (back to $a).
        expect((await engine.execute()).getNative()).to.equal(
            'O:8:"stdClass":1:{s:1:"b";O:8:"stdClass":1:{s:1:"a";r:1;}}'
        );
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should serialize an object that contains a reference to another property', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$obj = new stdClass();
$obj->a =& $obj->b; // Need to use a reference assignment for back-references to apply.

$result = serialize($obj);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.equal(
            'O:8:"stdClass":2:{s:1:"b";N;s:1:"a";R:2;}'
        );
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should serialize an array that contains an object back-reference', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$obj = new stdClass();
$obj->items = [$obj];

$result = serialize($obj);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        // $obj is position 1. The array element (the object itself) is encoded as r:1.
        expect((await engine.execute()).getNative()).to.equal(
            'O:8:"stdClass":1:{s:5:"items";a:1:{i:0;r:1;}}'
        );
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should serialize an array that contains an array back-reference', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$arr = [];
$arr[0] =& $arr; // Need to use a reference assignment for back-references to apply.

$result = serialize($arr);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        // $arr is position 1. The array element (the array itself) is encoded as r:1.
        expect((await engine.execute()).getNative()).to.equal(
            'a:1:{i:0;a:1:{i:0;R:2;}}'
        );
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should be able to serialize all supported value types', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['null'] = serialize(null);

$result['bool_true'] = serialize(true);
$result['bool_false'] = serialize(false);

$result['int'] = serialize(42);
$result['int_negative'] = serialize(-21);
$result['int_zero'] = serialize(0);

$result['float'] = serialize(3.14);
$result['float_whole'] = serialize(1.0);

$result['string_empty'] = serialize('');
$result['string_simple'] = serialize('hello');
$result['string_with_quotes'] = serialize('say "hi"');

$result['array_empty'] = serialize([]);
$result['array_indexed'] = serialize([1, 2, 3]);
$result['array_assoc'] = serialize(['a' => 1, 'b' => 2]);
$result['array_nested'] = serialize(['x' => [4, 5]]);

$obj = new stdClass();
$result['object_empty'] = serialize($obj);

$obj2 = new stdClass();
$obj2->name = 'Alice';
$obj2->age = 30;
$result['object_with_props'] = serialize($obj2);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'null': 'N;',
            'bool_true': 'b:1;',
            'bool_false': 'b:0;',
            'int': 'i:42;',
            'int_negative': 'i:-21;',
            'int_zero': 'i:0;',
            'float': 'd:3.14;',
            'float_whole': 'd:1;',
            'string_empty': 's:0:"";',
            'string_simple': 's:5:"hello";',
            'string_with_quotes': 's:8:"say "hi"";',
            'array_empty': 'a:0:{}',
            'array_indexed': 'a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}',
            'array_assoc': 'a:2:{s:1:"a";i:1;s:1:"b";i:2;}',
            'array_nested': 'a:1:{s:1:"x";a:2:{i:0;i:4;i:1;i:5;}}',
            'object_empty': 'O:8:"stdClass":0:{}',
            'object_with_props': 'O:8:"stdClass":2:{s:4:"name";s:5:"Alice";s:3:"age";i:30;}'
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
