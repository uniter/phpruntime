/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var Variable = require('../../Variable');

module.exports = function (internals) {
    var classAutoloader = internals.classAutoloader,
        valueFactory = internals.valueFactory;

    return {
        'spl_autoload_register': function (callableReference) {
            var isReference = (callableReference instanceof Variable),
                callableValue = isReference ? callableReference.getValue() : callableReference;

            classAutoloader.appendAutoloadCallable(callableValue);
        },
        'spl_autoload_unregister': function (callableReference) {
            var isReference = (callableReference instanceof Variable),
                callableValue = isReference ? callableReference.getValue() : callableReference;

            return valueFactory.createBoolean(
                classAutoloader.removeAutoloadCallable(callableValue)
            );
        }
    };
};
