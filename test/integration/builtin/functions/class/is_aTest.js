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

describe('PHP "is_a" builtin function integration', function () {
    it('should be able to determine whether an object or class is the same as or inherits from another', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

namespace My\Space
{
    class MyClass {}

    class MyBaseClass {}
}

namespace Your\Space
{
    class YourClass {}

    class YourDerivedClass extends \My\Space\MyBaseClass {}
}

namespace
{
    $myObject = new My\Space\MyClass;
    $yourObject = new Your\Space\YourClass;
    $yourDerivedObject = new Your\Space\YourDerivedClass;

    $result = [];

    // <object> is_a <class name>
    $result[] = is_a($myObject, 'My\Space\MyClass');
    $result[] = is_a($yourObject, 'Your\Space\YourClass');
    $result[] = is_a($yourDerivedObject, 'Your\Space\YourDerivedClass');
    $result[] = is_a($yourDerivedObject, 'My\Space\MyBaseClass');
    $result[] = is_a($yourObject, 'My\Space\MyClass');

    // <class name> is_a <other class name> when string is allowed
    $result[] = is_a('My\Space\MyClass', 'My\Space\MyClass', true);
    $result[] = is_a('Your\Space\YourDerivedClass', 'My\Space\MyBaseClass', true);
    $result[] = is_a('Your\Space\YourClass', 'My\Space\MyClass', true);

    // <class name> is_a <other class name> when string is not allowed
    $result[] = is_a('My\Space\MyClass', 'My\Space\MyClass');

    return $result;
}
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            // <object> is_a <class name>
            true,
            true,
            true,
            true,
            false,

            // <class name> is_a <other class name>
            true, // Unlike is_subclass_of(...), passing the same class name in should return true
            true,
            false,

            // <class name> is_a <other class name> when string is not allowed
            false
        ]);
    });
});
