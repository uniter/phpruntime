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
    var classAutoloader = internals.classAutoloader,
        globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Determines whether the specified class exists
         *
         * @see {@link https://secure.php.net/manual/en/function.class-exists.php}
         *
         * @param {Variable|Value} classNameReference      The name of the class to check for
         * @param {Variable|Value} callAutoloaderReference True to invoke the autoloader, false otherwise
         * @returns {*}
         */
        'class_exists': function (classNameReference, callAutoloaderReference) {
            var className = classNameReference.getNative(),
                callAutoloader = callAutoloaderReference ? callAutoloaderReference.getNative() : true;

            // Autoload the class if not already defined and autoloading is requested
            if (!globalNamespace.hasClass(className) && callAutoloader) {
                classAutoloader.autoloadClass(className);
            }

            return valueFactory.createBoolean(globalNamespace.hasClass(className));
        }
    };
};
