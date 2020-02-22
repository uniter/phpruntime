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
    beforeEach(function () {
        this.outputLog = [];
        this.doRun = function (engine) {
            // Capture the standard streams, prefixing each write with its name
            // so that we can ensure that what is written to each of them is in the correct order
            // with respect to one another
            engine.getStdout().on('data', function (data) {
                this.outputLog.push('[stdout]' + data);
            }.bind(this));
            engine.getStderr().on('data', function (data) {
                this.outputLog.push('[stderr]' + data);
            }.bind(this));

            engine.execute();
        }.bind(this);
    });

    it('should be able to trigger E_USER_*-level errors', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
ini_set('error_reporting', E_ALL);
ini_set('display_errors', true);

trigger_error('Without an explicit error type specified (defaults to E_USER_NOTICE)');
trigger_error('A user-level warning', E_USER_WARNING);
trigger_error('A user-level notice', E_USER_NOTICE);
trigger_error('A user-level deprecation warning', E_USER_DEPRECATED);
trigger_error('A user-level error', E_USER_ERROR);

return 'I should not be reached';
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile('/path/to/my_module.php', php),
            engine = module();

        // E_USER_ERROR should stop execution as a fatal error
        expect(function () {
            this.doRun(engine);
        }.bind(this)).to.throw(PHPFatalError, 'A user-level error');
        expect(this.outputLog).to.deep.equal([
'[stderr]PHP Notice:  Without an explicit error type specified (defaults to E_USER_NOTICE) in /path/to/my_module.php on line 5\n',
// NB: Stdout should have a leading newline written out just before the message
'[stdout]\nNotice: Without an explicit error type specified (defaults to E_USER_NOTICE) in /path/to/my_module.php on line 5\n',

'[stderr]PHP Warning:  A user-level warning in /path/to/my_module.php on line 6\n',
'[stdout]\nWarning: A user-level warning in /path/to/my_module.php on line 6\n',

'[stderr]PHP Notice:  A user-level notice in /path/to/my_module.php on line 7\n',
'[stdout]\nNotice: A user-level notice in /path/to/my_module.php on line 7\n',

'[stderr]PHP Deprecated:  A user-level deprecation warning in /path/to/my_module.php on line 8\n',
'[stdout]\nDeprecated: A user-level deprecation warning in /path/to/my_module.php on line 8\n',

'[stderr]PHP Fatal error:  A user-level error in /path/to/my_module.php on line 9\n',
'[stdout]\nFatal error: A user-level error in /path/to/my_module.php on line 9\n'
        ]);
    });
});
