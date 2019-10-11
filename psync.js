/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

/**
 * "Promise-synchronous" (psync) mode entrypoint
 *
 * Allows the public API to be Promise-based even when not using Pausable,
 * so that switching to/from async mode does not require changes to the consuming application.
 */

'use strict';

var builtins = require('./src/builtin/builtins'),
    runtime = require('phpcore/psync');

runtime.install(builtins);

module.exports = runtime;
