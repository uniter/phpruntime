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

describe('PHP "set_include_path" builtin function integration', function () {
    it('should be able to change the current configured include path', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
set_include_path('/some/include/path');

$result = [];
$result[] = set_include_path('.:/usr/include/php');
$result[] = get_include_path();

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            '/some/include/path',   // Previous include path should be returned
            '.:/usr/include/php'    // Path should be changed
        ]);
    });
});
