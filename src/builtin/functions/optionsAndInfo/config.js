/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpCommon = require('phpcommon'),
    Exception = phpCommon.Exception;

module.exports = function (internals) {
    var valueFactory = internals.valueFactory;

    return {
        /**
         * Fetches the value of a PHP configuration option as it was set in the INI file.
         * Any changes made at runtime (eg. with ini_set(...)) will _not_ be taken into account.
         *
         * @see {@link https://secure.php.net/manual/en/function.get-cfg-var.php}
         */
        'get_cfg_var': internals.typeFunction(
            'string $option : mixed',
            function (optionNameValue) {
                // TODO: Use union return type above once supported.

                var optionName = optionNameValue.getNative();

                if (optionName === 'cfg_file_path') {
                    return valueFactory.createString('/pseudo/uniter/php.ini');
                }

                throw new Exception(
                    'Cannot fetch option "' + optionName + '" - only cfg_file_path config option is currently supported'
                );
            }
        )
    };
};
