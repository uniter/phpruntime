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
    it('should just return all environment variables when no name is provided', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$environmentVariables = getenv();

return [
    'is_array' => is_array($environmentVariables),
    'count' => count($environmentVariables),
    'result' => $environmentVariables
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            environment = tools.createAsyncEnvironment({
                // Define the environment using the `env` option.
                env: {
                    'MY_VAR': 'my_value'
                }
            }),
            engine = module({}, environment);

        expect((await engine.execute()).getNative()).to.deep.equal({
            'is_array': true,
            'count': 1,
            'result': {
                'MY_VAR': 'my_value'
            }
        });
    });

    it('should return the value of the specified environment variable when a name is provided', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$name = 'MY_VAR';
$result[] = getenv($name);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            environment = tools.createAsyncEnvironment({
                env: {
                    'MY_VAR': 'my_value'
                }
            }),
            engine = module({}, environment);

        expect((await engine.execute()).getNative()).to.deep.equal([
            'my_value'
        ]);
    });

    it('should return false when trying to fetch a non-existent environment variable', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$name = 'MY_VAR';
$result[] = getenv($name);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            false
        ]);
    });
});
