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
    var readEnvironment = internals.getBinding('readEnvironment'),
        superGlobalScope = internals.state.getSuperGlobalScope(),
        envSuperGlobalArray = superGlobalScope.getVariable('_ENV').getValue(),
        valueFactory = internals.valueFactory;

    // Initialise the $_ENV superglobal with environment variables.
    Object.entries(readEnvironment()).forEach(function (entry) {
        envSuperGlobalArray.getElementByKey(valueFactory.createString(entry[0])).setValue(valueFactory.createString(String(entry[1])));
    });
};
