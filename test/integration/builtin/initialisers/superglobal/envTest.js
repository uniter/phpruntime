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

describe('PHP $_ENV superglobal initialiser integration', function () {
    it('should be populated with environment variables', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result['is_array'] = is_array($_ENV);
$result['count'] = count($_ENV);
$result['result'] = $_ENV;

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

        expect((await engine.execute()).getNative()).to.deep.equal({
            'is_array': true,
            'count': 1,
            'result': {
                'MY_VAR': 'my_value'
            }
        });
    });

    it('should allow modification of environment variables without affecting getenv()', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result['initial'] = $_ENV['MY_VAR'];
$_ENV['MY_VAR'] = 'new_value';
$result['modified'] = $_ENV['MY_VAR'];
$result['getenv'] = getenv('MY_VAR'); // Should still return original value.

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

        expect((await engine.execute()).getNative()).to.deep.equal({
            'initial': 'my_value',
            'modified': 'new_value',
            'getenv': 'my_value'
        });
    });
});
