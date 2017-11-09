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
    baseConversionMathFunctions = require('./functions/math/baseConversion'),
    classFunctions = require('./functions/class'),
    configOptionsAndInfoFunctions = require('./functions/optionsAndInfo/config'),
    constantFunctions = require('./functions/misc/constant'),
    Countable = require('./interfaces/Countable'),
    environmentFunctions = require('./functions/optionsAndInfo/environment'),
    extensionOptionsAndInfoFunctions = require('./functions/optionsAndInfo/extension'),
    filesystemConstants = require('./constants/filesystem'),
    filesystemFunctions = require('./functions/filesystem'),
    functionHandlingFunctions = require('./functions/functionHandling'),
    htmlStringFunctions = require('./functions/string/html'),
    InvalidArgumentException = require('./classes/InvalidArgumentException'),
    pcreConstants = require('./constants/pcre'),
    phpConstants = require('./constants/php'),
    phpOptionsAndInfoFunctions = require('./functions/optionsAndInfo/php'),
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
        pcreConstants,
        phpConstants
    ],
    functionGroups: [
        arrayFunctions,
        baseConversionMathFunctions,
        classFunctions,
        configOptionsAndInfoFunctions,
        constantFunctions,
        environmentFunctions,
        extensionOptionsAndInfoFunctions,
        filesystemFunctions,
        functionHandlingFunctions,
        htmlStringFunctions,
        phpOptionsAndInfoFunctions,
        stringFunctions,
        timeDateAndTimeFunctions,
        timeFunctions,
        variableHandlingFunctions
    ]
};
