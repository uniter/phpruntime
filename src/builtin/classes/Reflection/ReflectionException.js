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
    /**
     * Exception thrown when a reflection operation fails.
     *
     * @see {@link https://secure.php.net/manual/en/class.reflectionexception.php}
     * @constructor
     */
    function ReflectionException(...args) {
        internals.callSuperConstructor(this, args);
    }

    // Extend the base PHP Exception class.
    internals.extendClass('Exception');

    internals.disableAutoCoercion();

    return ReflectionException;
};
