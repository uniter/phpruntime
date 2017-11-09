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
        'get_cfg_var': function (optionNameReference) {
            var optionName = optionNameReference ?
                optionNameReference.getValue().getNative() :
                null;

            if (optionName === 'cfg_file_path') {
                return valueFactory.createString('/pseudo/uniter/php.ini');
            }

            throw new Error('Only cfg_file_path config option is currently supported');
        }
    };
};
