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
    /**
     * Interface for customising serialisation.
     *
     * @see {@link https://secure.php.net/manual/en/class.serializable.php}
     * @constructor
     */
    function Serializable() {

    }

    return {
        'Serializable': Serializable
    };
};
