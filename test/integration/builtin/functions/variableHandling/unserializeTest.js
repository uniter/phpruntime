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

describe('PHP "unserialize" builtin function integration', function () {
    it('should restore private and protected properties to the correct visibility slots', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

class BankAccount {
    private $pin;
    protected $balance;
    public $holder;

    public function getPin() { return $this->pin; }
    public function getBalance() { return $this->balance; }
}

// Properties are serialized in declaration order (pin, balance, holder) with null-byte encoding.
$serialized = "O:11:\"BankAccount\":3:{s:16:\"\0BankAccount\0pin\";i:9999;s:10:\"\0*\0balance\";i:500;s:6:\"holder\";s:3:\"Bob\";}";
$restored = unserialize($serialized);

$result = [];
$result['holder'] = $restored->holder;
$result['pin'] = $restored->getPin();
$result['balance'] = $restored->getBalance();
$result['class'] = get_class($restored);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'holder': 'Bob',
            'pin': 9999,
            'balance': 500,
            'class': 'BankAccount'
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should restore circular object self-references from r:N back-references', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$serialized = 'O:8:"stdClass":1:{s:4:"self";r:1;}';
$obj = unserialize($serialized);

$result = [];
$result['is_self_ref'] = $obj->self === $obj;
$result['class'] = get_class($obj);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'is_self_ref': true,
            'class': 'stdClass'
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should restore mutual object references from r:N back-references', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$serialized = 'O:8:"stdClass":1:{s:1:"b";O:8:"stdClass":1:{s:1:"a";r:1;}}';
$a = unserialize($serialized);

$result = [];
$result['a_b_a_is_a'] = $a->b->a === $a;
$result['a_class'] = get_class($a);
$result['b_class'] = get_class($a->b);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'a_b_a_is_a': true,
            'a_class': 'stdClass',
            'b_class': 'stdClass'
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should restore an object that contains a reference to another property', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$serialised = 'O:8:"stdClass":2:{s:1:"b";i:21;s:1:"a";R:2;}';
$obj = unserialize($serialised);

var_dump($obj);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        await engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
object(stdClass)#1 (2) {
  ["b"]=>
  &int(21)
  ["a"]=>
  &int(21)
}

EOS
*/;}) //jshint ignore:line
        );
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should restore an array containing an object back-reference', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$serialized = 'O:8:"stdClass":1:{s:5:"items";a:1:{i:0;r:1;}}';
$obj = unserialize($serialized);

$result = [];
$result['item_is_self'] = $obj->items[0] === $obj;
$result['class'] = get_class($obj);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'item_is_self': true,
            'class': 'stdClass'
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });


    it('should be able to unserialize all supported value types', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['null'] = unserialize('N;');

$result['bool_true'] = unserialize('b:1;');
$result['bool_false'] = unserialize('b:0;');

$result['int'] = unserialize('i:42;');
$result['int_negative'] = unserialize('i:-21;');

$result['float'] = unserialize('d:3.14;');

$result['string_empty'] = unserialize('s:0:"";');
$result['string_simple'] = unserialize('s:5:"hello";');
$result['string_with_quotes'] = unserialize('s:8:"say "hi"";');

$result['array_empty'] = unserialize('a:0:{}');
$result['array_indexed'] = unserialize('a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}');
$result['array_assoc'] = unserialize('a:2:{s:1:"a";i:1;s:1:"b";i:2;}');

$obj = unserialize('O:8:"stdClass":0:{}');
$result['object_class'] = get_class($obj);

$obj2 = unserialize('O:8:"stdClass":2:{s:4:"name";s:5:"Alice";s:3:"age";i:30;}');
$result['object_name'] = $obj2->name;
$result['object_age'] = $obj2->age;

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'null': null,
            'bool_true': true,
            'bool_false': false,
            'int': 42,
            'int_negative': -21,
            'float': 3.14,
            'string_empty': '',
            'string_simple': 'hello',
            'string_with_quotes': 'say "hi"',
            'array_empty': [],
            'array_indexed': [1, 2, 3],
            'array_assoc': {a: 1, b: 2},
            'object_class': 'stdClass',
            'object_name': 'Alice',
            'object_age': 30
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should restore an object whose class is namespaced', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

namespace My\App;

class Widget {
    public $name;
    public $count;
}

// "My\App\Widget" is 13 chars; properties in declaration order: name, count.
$serialized = 'O:13:"My\App\Widget":2:{s:4:"name";s:3:"cog";s:5:"count";i:7;}';
$restored = unserialize($serialized);

$result = [];
$result['class'] = get_class($restored);
$result['name'] = $restored->name;
$result['count'] = $restored->count;

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'class': 'My\\App\\Widget',
            'name': 'cog',
            'count': 7
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should be able to round-trip serialize and unserialize', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['scalar_roundtrip'] = unserialize(serialize(12345));
$result['array_roundtrip'] = unserialize(serialize(['key' => 'value', 'num' => 99]));

class MyData {
    public $x;
    public $y;
}

$point = new MyData();
$point->x = 10;
$point->y = 20;
$restored = unserialize(serialize($point));
$result['object_class'] = get_class($restored);
$result['object_x'] = $restored->x;
$result['object_y'] = $restored->y;

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'scalar_roundtrip': 12345,
            'array_roundtrip': {key: 'value', num: 99},
            'object_class': 'MyData',
            'object_x': 10,
            'object_y': 20
        });
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
