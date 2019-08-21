/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var INCLUDE_PATH_INI = 'include_path',
    PHPError = require('phpcommon').PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        iniState = internals.iniState,
        optionSet = internals.optionSet,
        valueFactory = internals.valueFactory;

    function getFileSystem() {
        var fileSystem = optionSet.getOption('fileSystem');

        if (!fileSystem) {
            throw new Error('filesystem :: No `fileSystem` option is configured');
        }

        return fileSystem;
    }

    return {
        'dirname': function (pathReference) {
            var pathValue = pathReference.getValue(),
                path = pathValue.getNative();

            if (path && path.indexOf('/') === -1) {
                path = '.';
            } else {
                path = path.replace(/\/[^\/]+$/, '');
            }

            pathValue = valueFactory.createString(path);

            return pathValue;
        },
        /**
         * Determines whether a file or directory exists with the given path
         *
         * @see {@link https://secure.php.net/manual/en/function.file-exists.php}
         *
         * @returns {BooleanValue}
         */
        'file_exists': function (pathReference) {
            var fileSystem,
                path;

            if (!pathReference) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'file_exists() expects exactly 1 parameter, 0 given'
                );
                return valueFactory.createNull();
            }

            fileSystem = getFileSystem();
            path = pathReference.getValue().getNative();

            return valueFactory.createBoolean(fileSystem.isFile(path) || fileSystem.isDirectory(path));
        },

        /**
         * Determines whether a file (not a directory) exists with the given path
         *
         * @see {@link https://secure.php.net/manual/en/function.get-include-path.php}
         *
         * @returns {StringValue}
         */
        'get_include_path': function () {
            return valueFactory.createString(iniState.get(INCLUDE_PATH_INI));
        },

        /**
         * Determines whether a file (not a directory) exists with the given path
         *
         * @see {@link https://secure.php.net/manual/en/function.is-file.php}
         *
         * @returns {BooleanValue}
         */
        'is_file': function (pathReference) {
            var fileSystem,
                path;

            if (!pathReference) {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'is_file() expects exactly 1 parameter, 0 given'
                );
                return valueFactory.createNull();
            }

            fileSystem = getFileSystem();
            path = pathReference.getValue().getNative();

            return valueFactory.createBoolean(fileSystem.isFile(path));
        },

        /**
         * Changes the include path, returning the old one
         *
         * @see {@link https://secure.php.net/manual/en/function.set-include-path.php}
         *
         * @returns {StringValue} Returns the old include path that was set previously
         */
        'set_include_path': function (newIncludePathReference) {
            var oldIncludePath = iniState.get(INCLUDE_PATH_INI);

            iniState.set(INCLUDE_PATH_INI, newIncludePathReference.getValue().getNative());

            return valueFactory.createString(oldIncludePath);
        }
    };
};
