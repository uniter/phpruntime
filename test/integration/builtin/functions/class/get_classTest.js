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

describe('PHP "get_class" builtin function integration', function () {
    it('should be able to fetch both the current class and the class of a specified object', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

namespace My\Space
{
    class FirstClass {
    }

    class SecondClass
    {
        public function getItsClass()
        {
            return get_class(); // With no arguments, should fetch the current FQCN
        }
    }
}

$firstObject = new My\Space\FirstClass;
$secondObject = new My\Space\SecondClass;

$result = [];
$result[] = get_class($firstObject);
$result[] = $secondObject->getItsClass();

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'My\\Space\\FirstClass',
            'My\\Space\\SecondClass'
        ]);
    });
});
