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
    var globalNamespace = internals.globalNamespace,
        Exception = globalNamespace.getClass('Exception');

    /**
     * Exception thrown if an argument is not of the expected type
     *
     * @see {@link https://secure.php.net/manual/en/class.invalidargumentexception.php}
     * @constructor
     */
    function InvalidArgumentException() {
        Exception.construct(this, arguments);
    }

    // Extend the base PHP Exception class
    InvalidArgumentException.superClass = Exception;

    internals.disableAutoCoercion();

    return InvalidArgumentException;
};
