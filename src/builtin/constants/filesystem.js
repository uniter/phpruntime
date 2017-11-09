/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = function () {
    return {
        'DIRECTORY_SEPARATOR': '/',
        'PATH_SEPARATOR': ':' // Be Unix-y and use colon rather than semi-colon (Windows)
    };
};
