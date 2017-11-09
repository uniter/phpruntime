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

describe('PHP "array_keys" builtin function integration', function () {
    it('should be able to fetch all keys defined by an array', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myArray = [
    'my numerically indexed value',
    'my_element' => 'my value',
    'my_null_element' => null
];

return array_keys($myArray);
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
            0,
            'my_element',
            'my_null_element'
        ]);
    });
});
