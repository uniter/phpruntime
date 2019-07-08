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
    var valueFactory = internals.valueFactory;

    return {
        /**
         * Fetches the value of a PHP configuration option as it was set in the INI file.
         * Any changes made at runtime (eg. with ini_set(...)) will _not_ be taken into account.
         *
         * @see {@link https://secure.php.net/manual/en/function.get-cfg-var.php}
         *
         * @param {Reference|Value|Variable} optionNameReference
         * @return {Value}
         */
        'get_cfg_var': function (optionNameReference) {
            var optionName = optionNameReference ?
                optionNameReference.getValue().getNative() :
                null;

            if (optionName === 'cfg_file_path') {
                return valueFactory.createString('/pseudo/uniter/php.ini');
            }

            throw new Error(
                'Cannot fetch option "' + optionName + '" - only cfg_file_path config option is currently supported'
            );
        }
    };
};
