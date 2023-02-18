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
    networkAddon = require('../../../../src/addon/network'),
    nowdoc = require('nowdoc'),
    tools = require('../../tools');

describe('PHP network constants integration', function () {
    var environment;

    beforeEach(function () {
        environment = tools.createAsyncEnvironment({}, [networkAddon]);
    });

    it('should support all the network constants', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    'STREAM_SERVER_BIND' => STREAM_SERVER_BIND,
    'STREAM_SERVER_LISTEN' => STREAM_SERVER_LISTEN
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment);

        expect((await engine.execute()).getNative()).to.deep.equal({
            'STREAM_SERVER_BIND': 4,
            'STREAM_SERVER_LISTEN': 8
        });
    });
});
