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
    Exception = phpCommon.Exception;

describe('PHP "var_dump" builtin function integration', function () {
    it('should be able to dump a complex object defined in PHP-land', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$myObject = (object)[
    'myBoolean' => true,
    'myNumber' => 1234,
    'myString' => 'my value',
    'myNestedNonRecursiveObject' => (object)[
        'mySubProp' => 'my sub prop value'
    ]
];
$myObject->myRecursiveObject = (object)[
    'myOtherSubProp' => 21,
    'recursiveRefToParentObject' => $myObject
];

var_dump($myObject);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/my/module.php', php),
            engine = module();

        await engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
object(stdClass)#2 (5) {
  ["myBoolean"]=>
  bool(true)
  ["myNumber"]=>
  int(1234)
  ["myString"]=>
  string(8) "my value"
  ["myNestedNonRecursiveObject"]=>
  object(stdClass)#1 (1) {
    ["mySubProp"]=>
    string(17) "my sub prop value"
  }
  ["myRecursiveObject"]=>
  object(stdClass)#3 (2) {
    ["myOtherSubProp"]=>
    int(21)
    ["recursiveRefToParentObject"]=>
    *RECURSION*
  }
}

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should be able to dump a complex array defined in PHP-land', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$myArray = [
    'myBoolean' => true,
    'myNumber' => 4321,
    'myString' => 'my value',
    'myNestedNonRecursiveArray' => [
        'mySubElement' => 'my sub element value'
    ]
];
$myArray['myRecursiveElement'] = [
    'myOtherSubElement' => 21,
    'recursiveRefToParentArray' => &$myArray
];

var_dump($myArray);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/my/module.php', php),
            engine = module();

        await engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
array(5) {
  ["myBoolean"]=>
  bool(true)
  ["myNumber"]=>
  int(4321)
  ["myString"]=>
  string(8) "my value"
  ["myNestedNonRecursiveArray"]=>
  array(1) {
    ["mySubElement"]=>
    string(20) "my sub element value"
  }
  ["myRecursiveElement"]=>
  array(2) {
    ["myOtherSubElement"]=>
    int(21)
    ["recursiveRefToParentArray"]=>
    &array(5) {
      ["myBoolean"]=>
      bool(true)
      ["myNumber"]=>
      int(4321)
      ["myString"]=>
      string(8) "my value"
      ["myNestedNonRecursiveArray"]=>
      array(1) {
        ["mySubElement"]=>
        string(20) "my sub element value"
      }
      ["myRecursiveElement"]=>
      *RECURSION*
    }
  }
}

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should be able to dump an array containing a resource defined in PHP-land', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$myArray = [
    'myBoolean' => true,
    'myResource' => create_my_resource()
];

var_dump($myArray);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/my/module.php', php),
            engine = module();
        engine.defineCoercingFunction('create_my_resource', function () {
            return this.valueFactory.createResource('my_resource_type', {});
        });

        await engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
array(2) {
  ["myBoolean"]=>
  bool(true)
  ["myResource"]=>
  resource(1) of type (my_resource_type)
}

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should be able to dump a complex object imported from JS-land as a JSObject (due to having a method)', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
var_dump($myObject);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/my/module.php', php),
            engine = module(),
            myObject = {
                myBoolean: true,
                myFunction: function () {},
                myNumber: 1234,
                myString: 'my value',
                myNestedNonRecursiveObject: {
                    mySubProp: 'my sub prop value'
                }
            };
        myObject.myRecursiveObject = {
            myOtherSubProp: 21,
            recursiveRefToParentObject: myObject
        };

        engine.expose(myObject, 'myObject');

        await engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
object(JSObject)#1 (6) {
  ["myBoolean"]=>
  bool(true)
  ["myFunction"]=>
  object(JSObject)#2 (0) {
  }
  ["myNumber"]=>
  int(1234)
  ["myString"]=>
  string(8) "my value"
  ["myNestedNonRecursiveObject"]=>
  array(1) {
    ["mySubProp"]=>
    string(17) "my sub prop value"
  }
  ["myRecursiveObject"]=>
  array(2) {
    ["myOtherSubProp"]=>
    int(21)
    ["recursiveRefToParentObject"]=>
    *RECURSION*
  }
}

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should throw when multiple variables are given (for now)', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$myArray = ['my' => 'array'];
$myNumber = 21;

var_dump($myArray, $myNumber);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/my/module.php', php),
            engine = module();

        await expect(engine.execute()).to.eventually.be.rejectedWith(
            Exception,
            'var_dump() :: Only one argument is currently supported, 2 given'
        );
    });
});
