/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

/**
 * PHP debugging support using the tick feature in PHPCore
 */
module.exports = function (internals) {
    var driver = null;

    return {
        tick: function (path, startLine, startColumn, endLine, endColumn) {
            if (driver === null) {
                // Fetch binding late, as option groups are always loaded before bindings
                // so attempting to fetch this above would result in an error
                driver = internals.getBinding('debugger');
            }

            driver.tick(path, startLine, startColumn, endLine, endColumn);
        }
    };
};
