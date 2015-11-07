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
    myModule = require('./myModule.fixture'),
    myModulePath = require.resolve('./myModule.fixture'),
    nowdoc = require('nowdoc'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    syncPHPRuntime = require('../../../../../sync');

describe('PHP "var_dump" builtin function integration', function () {
    it('should be able to dump a Node.js module object', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
var_dump($myModule);
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

        engine.expose(myModule, 'myModule');

        engine.execute();

        expect(engine.getStdout().readAll()).to.contain(
            nowdoc(function () {/*<<<EOS
object(JSObject)#1 (2) {
  ["myModule"]=>
  string(10) "yes, it is"
  ["theModule"]=>
  object(JSObject)#2 (7) {
    ["id"]=>
    string(121) "${myModulePath}"
    ["exports"]=>
    *RECURSION*
EOS
*/;}, {myModulePath: myModulePath}) //jshint ignore:line
        );
    });
});
