/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = function (internals) {
    var driver = internals.getBinding('debugger');

    return {
        /**
         * Pauses the current script if attached to a debugger
         *
         * @see {@link https://xdebug.org/docs/all_functions#xdebug_break}
         *
         * @returns {NullValue}
         */
        'xdebug_break': function () {
            driver.pause();
        }
    };
};
