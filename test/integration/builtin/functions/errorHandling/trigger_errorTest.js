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
    phpCommon = require('phpcommon'),
    tools = require('../../../tools'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('PHP "trigger_error" builtin function integration', function () {
    it('should be able to trigger E_USER_*-level errors', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

trigger_error('Without an explicit error type specified (defaults to E_USER_NOTICE)');
trigger_error('A user-level warning', E_USER_WARNING);
trigger_error('A user-level notice', E_USER_NOTICE);
trigger_error('A user-level deprecation warning', E_USER_DEPRECATED);
trigger_error('A user-level error', E_USER_ERROR);

return 'I should not be reached';
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        // E_USER_ERROR should stop execution as a fatal error
        expect(function () {
            engine.execute();
        }.bind(this)).to.throw(PHPFatalError, 'A user-level error');
        expect(engine.getStdout().readAll()).to.equal('');
        expect(engine.getStderr().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
PHP Notice: Without an explicit error type specified (defaults to E_USER_NOTICE)
PHP Warning: A user-level warning
PHP Notice: A user-level notice
PHP Deprecated: A user-level deprecation warning
PHP Fatal error: A user-level error

EOS
*/;}) //jshint ignore:line
        );
    });
});
