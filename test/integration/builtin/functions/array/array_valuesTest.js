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

describe('PHP "array_values" builtin function integration', function () {
    it('should fetch only the values of an array, without sorting', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result[] = array_values([2 => 'two', '0' => 'zero', '1' => 'one']);
$result[] = array_values(['first' => 'value 1', 'second' => 'value 2']);

return $result;
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

        expect(engine.execute().getNative()).to.deep.equal([
            ['two', 'zero', 'one'],
            ['value 1', 'value 2']
        ]);
    });
});
