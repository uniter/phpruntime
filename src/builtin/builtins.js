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
    Countable = require('./interfaces/SPL/Countable'),
    environmentFunctions = require('./functions/optionsAndInfo/environment'),
    errorHandlingConstants = require('./constants/errorHandling'),
    errorHandlingFunctions = require('./functions/errorHandling'),
    extensionOptionsAndInfoFunctions = require('./functions/optionsAndInfo/extension'),
    filesystemConstants = require('./constants/filesystem'),
    filesystemFunctions = require('./functions/filesystem'),
    functionHandlingFunctions = require('./functions/functionHandling'),
    htmlStringFunctions = require('./functions/string/html'),
    InvalidArgumentException = require('./classes/Exception/InvalidArgumentException'),
    LogicException = require('./classes/Exception/LogicException'),
    pcreConstants = require('./constants/pcre'),
    phpConstants = require('./constants/php'),
    phpOptionsAndInfoFunctions = require('./functions/optionsAndInfo/php'),
    splFunctions = require('./functions/spl'),
    stringBindings = require('./bindings/string'),
    stringFunctions = require('./functions/string'),
    timeDateAndTimeFunctions = require('./functions/dateAndTime/time'),
    timeFunctions = require('./functions/time'),
    variableHandlingFunctions = require('./functions/variableHandling');

module.exports = {
    bindingGroups: [
        stringBindings
    ],
    classGroups: [
        function () {
            return {
                'Countable': Countable
            };
        },
        function () {
            return {
                'LogicException': LogicException
            };
        },
        function () {
            return {
                'InvalidArgumentException': InvalidArgumentException
            };
        }
    ],
    constantGroups: [
        arrayConstants,
        errorHandlingConstants,
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
        errorHandlingFunctions,
        extensionOptionsAndInfoFunctions,
        filesystemFunctions,
        functionHandlingFunctions,
        htmlStringFunctions,
        phpOptionsAndInfoFunctions,
        splFunctions,
        stringFunctions,
        timeDateAndTimeFunctions,
        timeFunctions,
        variableHandlingFunctions
    ]
};
