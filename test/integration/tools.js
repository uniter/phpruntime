/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var builtins = require('../../src/builtin/builtins'),
    path = require('path'),
    phpCorePath = path.dirname(require.resolve('phpcore')),
    phpTest = require('phptest');

module.exports = phpTest.createIntegrationTools(phpCorePath, function (runtime) {
    runtime.install(builtins);

    return runtime;
});
