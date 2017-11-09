/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    INCLUDE_PATH_INI = 'include_path',
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
        'file_put_contents': function (pathReference, dataReference, flagsReference, contextReference) {
            var contextValue,
                data,
                dataValue,
                fileSystem,
                flagsValue,
                pathValue,
                stream,
                values;

            pathValue = pathReference.getValue();
            dataValue = dataReference.getValue();
            flagsValue = flagsReference ? (
                flagsReference.getValue()
            ) : null;
            contextValue = contextReference ? (
                contextReference.getValue()
            ) : null;

            // Handle `path` arg
            if (pathValue.getType() !== 'string') {
                callStack.raiseError(
                    PHPError.E_WARNING,
                    'file_exists() fixme'
                );
                return valueFactory.createBoolean(false);
            }

            // Handle `data` arg
            if (dataValue.getType() === 'string') {
                data = dataValue.getNative();
            } else if (dataValue.getType() === 'array') {
                values = dataValue.getValues();

                _.each(values, function (value, key) {
                    values[key] = value.coerceToString().getNative();
                });

                data = valueFactory.createString(values.join(''));
            } else if (dataValue.getType() === 'resource') {
                throw new Error('file_put_contents() :: Resource as data is not yet implemented');
            } else {
                throw new Error('fixme');
            }

            // Handle `flags` arg
            if (flagsValue && (flagsValue.getType() !== 'integer' || flagsValue.getNative() !== 0)) {
                throw new Error('file_put_contents() :: Only flags=0 is supported');
            }

            if (contextValue) {
                throw new Error('file_put_contents() :: Custom contexts are not yet implemented');
            }

            fileSystem = getFileSystem();

            // Open the file, write its new contents to it and close
            stream = fileSystem.openSync(pathValue.getNative());
            stream.writeSync(data);
            stream.closeSync();

            // Return the number of bytes written to the file on success
            return valueFactory.createInteger(data.length);
        },
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
        'realpath': function (pathReference) {
            // FIXME: Stub
            return pathReference;
        },
        'set_include_path': function (newIncludePathReference) {
            var oldIncludePath = iniState.get(INCLUDE_PATH_INI);

            iniState.set(INCLUDE_PATH_INI, newIncludePathReference.getValue().getNative());

            return valueFactory.createString(oldIncludePath);
        },
        'unlink': function (pathReference, contextReference) {
            var fileSystem,
                path;

            if (contextReference) {
                throw new Error('unlink() :: Context arg not yet supported');
            }

            fileSystem = getFileSystem();
            path = pathReference.getValue().getNative();

            fileSystem.unlinkSync(path);

            return valueFactory.createBoolean(true);
        }
    };
};
