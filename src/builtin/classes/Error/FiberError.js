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
     * Error thrown when an invalid operation is performed on a Fiber.
     *
     * @see {@link https://secure.php.net/manual/en/class.fibererror.php}
     * @constructor
     */
    function FiberError() {
        internals.callSuperConstructor(this, arguments);
    }

    // Extend the base PHP Error class.
    internals.extendClass('Error');

    internals.disableAutoCoercion();

    return FiberError;
};
