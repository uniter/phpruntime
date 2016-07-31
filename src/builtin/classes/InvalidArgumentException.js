/*
 * PHPCore - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpcore/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpcore/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = function (internals) {
    var globalNamespace = internals.globalNamespace;

    function InvalidArgumentException() {

    }

    InvalidArgumentException.superClass = globalNamespace.getClass('Exception');

    return InvalidArgumentException;
};
