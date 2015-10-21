/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var INCLUDE_PATH_INI = 'include_path';

module.exports = function (internals) {
    var iniState = internals.iniState,
        valueFactory = internals.valueFactory;

    return {
        'dirname': function (pathReference) {
            var pathValue = pathReference.getValue(),
                path = pathValue.getNative();

            if (path && path.indexOf('/') === -1) {
                path = '.';
            } else {
                path = path.replace(/\/[^\/]+$/, '');
            }

            pathValue = valueFactory.createString(path);

            return pathValue;
        },
        'get_include_path': function () {
            return valueFactory.createString(iniState.get(INCLUDE_PATH_INI));
        },
        'set_include_path': function (newIncludePathReference) {
            var oldIncludePath = iniState.get(INCLUDE_PATH_INI);

            iniState.set(INCLUDE_PATH_INI, newIncludePathReference.getValue().getNative());

            return valueFactory.createString(oldIncludePath);
        }
    };
};
