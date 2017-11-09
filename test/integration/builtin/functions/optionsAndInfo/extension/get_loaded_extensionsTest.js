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
    syncPHPRuntime = require('../../../../../../sync');

describe('PHP "get_loaded_extensions" builtin function integration', function () {
    it('should just return an empty array for now', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$extensions = get_loaded_extensions();

return [
    'is_array' => is_array($extensions),
    'count' => count($extensions)
];
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

        expect(engine.execute().getNative()).to.deep.equal({
            'is_array': true,
            'count': 0
        });
    });
});
