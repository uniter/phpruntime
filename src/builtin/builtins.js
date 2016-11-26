/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var arrayConstants = require('./constants/array'),
    arrayFunctions = require('./functions/array'),
    classFunctions = require('./functions/class'),
    constantFunctions = require('./functions/misc/constant'),
    Countable = require('./interfaces/Countable'),
    filesystemConstants = require('./constants/filesystem'),
    filesystemFunctions = require('./functions/filesystem'),
    functionHandlingFunctions = require('./functions/functionHandling'),
    InvalidArgumentException = require('./classes/InvalidArgumentException'),
    phpConstants = require('./constants/php'),
    stringFunctions = require('./functions/string'),
    timeDateAndTimeFunctions = require('./functions/dateAndTime/time'),
    timeFunctions = require('./functions/time'),
    variableHandlingFunctions = require('./functions/variableHandling');

module.exports = {
    classes: {
        'Countable': Countable,
        'InvalidArgumentException': InvalidArgumentException
    },
    constantGroups: [
        arrayConstants,
        filesystemConstants,
        phpConstants
    ],
    functionGroups: [
        arrayFunctions,
        classFunctions,
        constantFunctions,
        filesystemFunctions,
        functionHandlingFunctions,
        stringFunctions,
        timeDateAndTimeFunctions,
        timeFunctions,
        variableHandlingFunctions
    ]
};
