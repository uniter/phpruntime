/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpCommon = require('phpcommon'),
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        pausable = internals.pausable;

    return {
        'usleep': function (microsecondsReference) {
            var microsecondsValue = microsecondsReference.getValue(),
                pause;

            if (microsecondsValue.getType() !== 'integer' && microsecondsValue.getType() !== 'float') {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'usleep() expects parameter 1 to be integer or float, ' +
                        microsecondsValue.getType() + ' given'
                );
                return;
            }

            pause = pausable.createPause();

            setTimeout(function () {
                pause.resume();
            }, microsecondsValue.getNative() / 1000);

            pause.now();
        }
    };
};
