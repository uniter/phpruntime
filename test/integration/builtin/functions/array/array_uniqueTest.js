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

describe('PHP "array_unique" builtin function integration', function () {
    it('should be able to fetch only the unique values of an array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result[] = array_unique(['a' => 'green', 'red', 'b' => 'green', 'blue', 'red']);

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
            {
                'a': 'green',
                '0': 'red',
                '1': 'blue'
            }
        ]);
    });
});
