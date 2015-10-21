/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var arrayFunctions = require('./functions/array'),
    constantFunctions = require('./functions/constant'),
    filesystemConstants = require('./constants/filesystem'),
    filesystemFunctions = require('./functions/filesystem'),
    functionHandlingFunctions = require('./functions/functionHandling'),
    stringFunctions = require('./functions/string'),
    timeFunctions = require('./functions/time'),
    variableHandlingFunctions = require('./functions/variableHandling');

module.exports = {
    constantGroups: [
        filesystemConstants
    ],
    functionGroups: [
        arrayFunctions,
        constantFunctions,
        filesystemFunctions,
        functionHandlingFunctions,
        stringFunctions,
        timeFunctions,
        variableHandlingFunctions
    ]
};
