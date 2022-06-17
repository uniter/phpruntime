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
    sinon = require('sinon'),
    tools = require('../../../../tools'),
    Clock = require('../../../../../../src/Clock');

describe('PHP "time" builtin function integration', function () {
    var clock,
        environment;

    beforeEach(function () {
        clock = sinon.createStubInstance(Clock);

        environment = tools.createAsyncEnvironment({}, [
            {
                serviceGroups: [
                    function (internals) {
                        internals.allowServiceOverride();

                        return {
                            'clock': function () {
                                return clock;
                            }
                        };
                    }
                ]
            }
        ]);
    });

    it('should return the current Unix timestamp in seconds', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return time();
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment),
            resultValue;
        clock.getUnixTimestamp.returns(123456789);

        resultValue = await engine.execute();

        expect(resultValue.getType()).to.equal('int');
        expect(resultValue.getNative()).to.equal(123456789);
    });
});
