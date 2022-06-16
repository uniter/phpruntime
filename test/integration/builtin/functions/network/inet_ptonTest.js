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
    networkAddon = require('../../../../../src/addon/network'),
    nowdoc = require('nowdoc'),
    tools = require('../../../tools');

describe('PHP "inet_pton" builtin function integration', function () {
    var environment;

    beforeEach(function () {
        environment = tools.createAsyncEnvironment({}, [networkAddon]);
    });

    it('should be able to convert a valid IPv4 dotted decimal', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['ipv4 dotted decimal'] = inet_pton('4.5.6.7');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment);

        expect((await engine.execute()).getNative()).to.deep.equal({
            'ipv4 dotted decimal': '\x04\x05\x06\x07'
        });
    });
});
