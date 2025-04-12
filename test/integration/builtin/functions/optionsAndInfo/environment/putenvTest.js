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

describe('PHP "putenv" builtin function integration', function () {
    it('should set an environment variable with a value', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result['setting with value'] = putenv('MY_VAR=my_value');
$result['getting value'] = getenv('MY_VAR');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'setting with value': true,
            'getting value': 'my_value'
        });
    });

    it('should remove an environment variable when no value nor equals sign is specified', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result['initial set'] = putenv('YOUR_VAR=your_value');
$result['first get'] = getenv('YOUR_VAR');
$result['removing var'] = putenv('YOUR_VAR');
$result['second get'] = getenv('YOUR_VAR');
$result['getenv after removal'] = getenv();

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({
                // Define the environment using the `env` option.
                env: {
                    'MY_VAR': 'my_value'
                }
            });

        expect((await engine.execute()).getNative()).to.deep.equal({
            'initial set': true,
            'first get': 'your_value',
            'removing var': true,
            'second get': false,
            'getenv after removal': {
                'MY_VAR': 'my_value'
            }
        });
    });

    it('should set an environment variable to the empty string when no value is specified', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];
$result['set'] = putenv('YOUR_VAR=');
$result['get'] = getenv('YOUR_VAR');
$result['getenv after removal'] = getenv();

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({
                // Define the environment using the `env` option.
                env: {
                    'MY_VAR': 'my_value'
                }
            });

        expect((await engine.execute()).getNative()).to.deep.equal({
            'set': true,
            'get': '',
            'getenv after removal': {
                'MY_VAR': 'my_value',
                'YOUR_VAR': ''
            }
        });
    });

    it('should return true when setting an environment variable', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return putenv('MY_VAR=my_value');
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.equal(true);
    });
});
