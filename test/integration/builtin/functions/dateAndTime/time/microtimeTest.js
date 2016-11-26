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
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    sinon = require('sinon'),
    syncPHPRuntime = require('../../../../../../sync');

describe('PHP "microtime" builtin function integration', function () {
    it('should return the current seconds+us when get_as_float = true', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return microtime(true);
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            getTimeInMicroseconds = sinon.stub(),
            engine = module({
                performance: {
                    getTimeInMicroseconds: getTimeInMicroseconds
                }
            }),
            resultValue;
        getTimeInMicroseconds.returns(123456789);

        resultValue = engine.execute();

        expect(resultValue.getType()).to.equal('float');
        expect(resultValue.getNative()).to.equal(123.456789);
    });

    it('should return the current seconds and us when get_as_float = false', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return microtime(false);
EOS
*/;}), //jshint ignore:line
            js = phpToJS.transpile(phpToAST.create().parse(php)),
            module = new Function(
                'require',
                'return ' + js
            )(function () {
                return syncPHPRuntime;
            }),
            getTimeInMicroseconds = sinon.stub(),
            engine = module({
                performance: {
                    getTimeInMicroseconds: getTimeInMicroseconds
                }
            }),
            resultValue;
        getTimeInMicroseconds.returns(123456789);

        resultValue = engine.execute();

        // Result should be a string in the format "msec sec", where:
        // - sec is the number of seconds since the Unix epoch (0:00:00 January 1, 1970 GMT)
        // - msec measures microseconds that have elapsed since sec and is also expressed in seconds.
        expect(resultValue.getType()).to.equal('string');
        expect(resultValue.getNative()).to.equal('0.456789 123');
    });
});
