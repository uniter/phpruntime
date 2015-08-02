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
    var globalNamespace = internals.globalNamespace,
        valueFactory = internals.valueFactory;

    return {
        'function_exists': function (nameReference) {
            var name = nameReference.getValue().getNative().replace(/^\\/, '');

            try {
                globalNamespace.getFunction(name);
            } catch (e) {
                return valueFactory.createBoolean(false);
            }

            return valueFactory.createBoolean(true);
        }
    };
};
