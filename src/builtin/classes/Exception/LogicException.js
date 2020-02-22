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
     * Exception representing an issue with the logic of the program
     *
     * @see {@link https://secure.php.net/manual/en/class.logicexception.php}
     * @constructor
     */
    function LogicException() {
        internals.callSuperConstructor(this, arguments);
    }

    // Extend the base PHP Exception class
    internals.extendClass('Exception');

    internals.disableAutoCoercion();

    return LogicException;
};
