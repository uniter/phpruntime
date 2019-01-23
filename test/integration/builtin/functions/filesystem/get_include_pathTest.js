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

describe('PHP "get_include_path" builtin function integration', function () {
    it('should be able to fetch the current configured include path', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result[] = get_include_path();

set_include_path('.:/usr/include/php');
$result[] = get_include_path();

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            '.',                    // Default include path should only look in the current directory
            '.:/usr/include/php'    // Path should be modifiable with set_include_path(...)
        ]);
    });
});
