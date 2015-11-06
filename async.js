/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var builtins = require('./src/builtin/builtins'),
    runtime = require('phpcore/async');

runtime.install(builtins);

module.exports = runtime;
