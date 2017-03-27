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
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    syncPHPRuntime = require('../../../../../sync');

describe('PHP "class_exists" builtin function integration', function () {
    it('should support testing classes both with and without a namespace prefix', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
namespace My\Namespace
{
    class MyClass {}
}

namespace
{
    $result = [];
    $result['fqcn'] = class_exists('My\Namespace\MyClass');
    $result['missing_namespace'] = class_exists('MyClass');
    $result['undef'] = class_exists('AnUndefinedClass');
    var_dump($result);
}
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            engine = module();

        engine.execute();

        expect(engine.getStdout().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
array(3) {
  ["fqcn"]=>
  bool(true)
  ["missing_namespace"]=>
  bool(false)
  ["undef"]=>
  bool(false)
}

EOS
*/;}) //jshint ignore:line
        );
    });
});
