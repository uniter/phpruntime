/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var INCLUDE_PATH_INI = 'include_path';

module.exports = function (internals) {
    var iniState = internals.iniState,
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
        /**
         * Extracts the parent or an ancestor directory's path.
         *
         * @see {@link https://secure.php.net/manual/en/function.dirname.php}
         */
        'dirname': internals.typeFunction(
            'string $path, int $levels = 1 : string',
            function (pathValue, levelsValue) {
                var componentIndex,
                    path = pathValue.getNative(),
                    levels = levelsValue.getNative();

                if (!path) {
                    return '';
                }

                if (path.indexOf('/') === -1) {
                    path = '.';
                } else {
                    for (componentIndex = 0; componentIndex < levels; componentIndex++) {
                        path = path.replace(/(?:^\/|(?!^)\/+)[^\/]+$/, '');
                    }

                    if (path === '') {
                        path = '/';
                    }
                }

                return path;
            }
        ),

        /**
         * Closes an open file handle.
         *
         * @see {@link https://secure.php.net/manual/en/function.fclose.php}
         */
        'fclose': internals.typeFunction(
            'mixed $stream : bool',
            function (streamValue) {
                // TODO: Add resource type above once supported.
                var resource,
                    stream;

                if (streamValue.getType() !== 'resource') {
                    throw new Error('fclose() :: Non-resource given - TODO add parameter type');
                }

                if (streamValue.getResourceType() !== 'stream') {
                    throw new Error('fclose() :: Non-stream resource given');
                }

                resource = streamValue.getResource();
                stream = resource.stream;

                // Ensure we return the future from .close() so that the stream is fully closed.
                return stream.close();
            }
        ),

        /**
         * Checks whether the given stream has reached end-of-file.
         *
         * @see {@link https://secure.php.net/manual/en/function.feof.php}
         */
        'feof': internals.typeFunction(
            // TODO: Use "resource" parameter type once supported.
            'mixed $stream : bool',
            function (streamValue) {
                var eof;

                if (streamValue.getType() !== 'resource') {
                    throw new Error('fclose() :: Non-resource given - TODO add parameter type');
                }

                if (streamValue.getResourceType() !== 'stream') {
                    throw new Error('fclose() :: Non-stream resource given');
                }

                eof = streamValue.getResource().stream.isEof();

                return eof;
            }
        ),

        /**
         * Determines whether a file or directory exists with the given path.
         *
         * @see {@link https://secure.php.net/manual/en/function.file-exists.php}
         */
        'file_exists': internals.typeFunction(
            'string $filename : bool',
            function (pathValue) {
                var fileSystem = getFileSystem(),
                    path = pathValue.getNative();

                return valueFactory.createBoolean(
                    fileSystem.isFile(path) || fileSystem.isDirectory(path)
                );
            }
        ),

        /**
         * Writes to an open file handle in a binary-safe manner.
         *
         * @see {@link https://secure.php.net/manual/en/function.fwrite.php}
         *
         * @returns {BooleanValue|IntegerValue}
         */
        'fwrite': internals.typeFunction(
            'mixed $stream, string $data, ?int $length = null',
            function (streamValue, dataValue, lengthValue) {
                // TODO: Add resource & return types above once supported.
                var data,
                    length,
                    resource,
                    stream,
                    writtenLength;

                if (streamValue.getType() !== 'resource') {
                    throw new Error('fwrite() :: Non-resource given - TODO add parameter type');
                }

                if (streamValue.getResourceType() !== 'stream') {
                    throw new Error('fwrite() :: Non-stream resource given');
                }

                resource = streamValue.getResource();
                stream = resource.stream;
                data = dataValue.getNative();
                length = lengthValue.getNative();
                writtenLength = data.length;

                if (length !== null) {
                    data = data.substring(0, length);
                    writtenLength = data.length;
                }

                // Ensure we return the future from .write() so that the data is fully written.
                return stream.write(data)
                    .next(function () {
                        // Return the number of bytes actually written.
                        return valueFactory.createInteger(writtenLength);
                    });
            }
        ),

        /**
         * Fetches the currently configured include path.
         *
         * @see {@link https://secure.php.net/manual/en/function.get-include-path.php}
         */
        'get_include_path': internals.typeFunction(': mixed', function () {
            // FIXME: Add union return type above once supported.

            return valueFactory.createString(iniState.get(INCLUDE_PATH_INI));
        }),

        /**
         * Determines whether a file (not a directory) exists with the given path.
         *
         * @see {@link https://secure.php.net/manual/en/function.is-file.php}
         */
        'is_file': internals.typeFunction('string $filename : bool', function (pathValue) {
            var fileSystem = getFileSystem(),
                path = pathValue.getNative();

            return valueFactory.createBoolean(fileSystem.isFile(path));
        }),

        /**
         * Changes the include path, returning the old one.
         *
         * @see {@link https://secure.php.net/manual/en/function.set-include-path.php}
         */
        'set_include_path': internals.typeFunction(
            'string $include_path : mixed',
            function (newIncludePathValue) {
                // FIXME: Add union return type above once supported.

                var oldIncludePath = iniState.get(INCLUDE_PATH_INI);

                iniState.set(INCLUDE_PATH_INI, newIncludePathValue.getNative());

                return valueFactory.createString(oldIncludePath);
            }
        )
    };
};
