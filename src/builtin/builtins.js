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
    clockServices = require('./services/clock'),
    configOptionsAndInfoFunctions = require('./functions/optionsAndInfo/config'),
    constantFunctions = require('./functions/misc/constant'),
    Countable = require('./interfaces/SPL/Countable'),
    environmentBindings = require('./bindings/environment'),
    environmentFunctions = require('./functions/optionsAndInfo/environment'),
    environmentSuperglobalInitialiser = require('./initialisers/superglobal/env'),
    errorHandlingFunctions = require('./functions/errorHandling'),
    errorMessages = require('./messages/error.en_GB'),
    extensionOptionsAndInfoFunctions = require('./functions/optionsAndInfo/extension'),
    Fiber = require('./classes/Fiber/Fiber'),
    FiberError = require('./classes/Error/FiberError'),
    filesystemConstants = require('./constants/filesystem'),
    filesystemFunctions = require('./functions/filesystem'),
    functionHandlingFunctions = require('./functions/functionHandling'),
    htmlStringFunctions = require('./functions/string/html'),
    InvalidArgumentException = require('./classes/Exception/InvalidArgumentException'),
    LogicException = require('./classes/Exception/LogicException'),
    outputControlConstants = require('./constants/outputControl'),
    outputControlFunctions = require('./functions/outputControl'),
    pcreCommonFunctions = require('./functions/pcre/common'),
    pcreConstants = require('./constants/pcre'),
    phpConstants = require('./constants/php'),
    phpOptionsAndInfoFunctions = require('./functions/optionsAndInfo/php'),
    roundingMathFunctions = require('./functions/math/rounding'),
    Serializable = require('./interfaces/SPL/Serializable'),
    splFunctions = require('./functions/spl'),
    SplDoublyLinkedList = require('./classes/SPL/Datastructures/SplDoublyLinkedList'),
    SplObjectStorage = require('./classes/SPL/Datastructures/SplObjectStorage'),
    SplQueue = require('./classes/SPL/Datastructures/SplQueue'),
    stringBindings = require('./bindings/string'),
    stringConstants = require('./constants/string'),
    stringFunctions = require('./functions/string'),
    timeDateAndTimeFunctions = require('./functions/dateAndTime/time'),
    timeFunctions = require('./functions/misc/time'),
    urlFunctions = require('./functions/url'),
    variableHandlingFunctions = require('./functions/variableHandling'),
    warningMessages = require('./messages/warning.en_GB');

module.exports = {
    bindingGroups: [
        environmentBindings,
        stringBindings
    ],
    classGroups: [
        function () {
            return {
                'Countable': Countable,
                'Fiber': Fiber,
                'FiberError': FiberError,
                'LogicException': LogicException,
                'Serializable': Serializable
            };
        },
        function () {
            return {
                'SplDoublyLinkedList': SplDoublyLinkedList
            };
        },
        function () {
            return {
                'InvalidArgumentException': InvalidArgumentException,
                'SplObjectStorage': SplObjectStorage,
                'SplQueue': SplQueue
            };
        }
    ],
    constantGroups: [
        arrayConstants,
        filesystemConstants,
        outputControlConstants,
        pcreConstants,
        phpConstants,
        stringConstants
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
        outputControlFunctions,
        pcreCommonFunctions,
        phpOptionsAndInfoFunctions,
        roundingMathFunctions,
        splFunctions,
        stringFunctions,
        timeDateAndTimeFunctions,
        timeFunctions,
        urlFunctions,
        variableHandlingFunctions
    ],
    initialiserGroups: [
        environmentSuperglobalInitialiser
    ],
    serviceGroups: [
        clockServices
    ],
    translationCatalogues: [
        errorMessages,
        warningMessages
    ]
};
