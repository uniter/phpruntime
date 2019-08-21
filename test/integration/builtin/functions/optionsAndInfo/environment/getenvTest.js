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
    tools = require('../../../../tools');

describe('PHP "getenv" builtin function integration', function () {
    it('should just return an empty array for now when trying to fetch all environment variables', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$environmentVariables = getenv();

return [
    'is_array' => is_array($environmentVariables),
    'count' => count($environmentVariables)
];
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal({
            'is_array': true,
            'count': 0
        });
    });

    it('should just return false for now when trying to fetch any specific environment variable', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$name = 'MY_VAR';
$result[] = getenv($name);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            false // No environment variables are supported for now
        ]);
    });
});
