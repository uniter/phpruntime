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
    tools = require('../../../../tools');

describe('PHP "microtime" builtin function integration', function () {
    var environment,
        getTimeInMicroseconds;

    beforeEach(function () {
        getTimeInMicroseconds = sinon.stub();

        environment = tools.createAsyncEnvironment({
            performance: {
                getTimeInMicroseconds: getTimeInMicroseconds
            }
        });
    });

    it('should return the current seconds+us when get_as_float = true', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return microtime(true);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment),
            resultValue;
        getTimeInMicroseconds.returns(123456789);

        resultValue = await engine.execute();

        expect(resultValue.getType()).to.equal('float');
        expect(resultValue.getNative()).to.equal(123.456789);
    });

    it('should return the current seconds and us when get_as_float = false', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return microtime(false);
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module({}, environment),
            resultValue;
        getTimeInMicroseconds.returns(123456789);

        resultValue = await engine.execute();

        // Result should be a string in the format "msec sec", where:
        // - sec is the number of seconds since the Unix epoch (0:00:00 January 1, 1970 GMT)
        // - msec measures microseconds that have elapsed since sec and is also expressed in seconds.
        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('0.456789 123');
    });
});
