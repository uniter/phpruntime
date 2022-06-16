/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

/**
 * Stream-related PHP builtin functions.
 *
 * @param {object} internals
 * @return {object}
 */
module.exports = function (internals) {
    var flow = internals.flow,
        socketStreamConnector = internals.getService('socket_stream_connector'),
        valueFactory = internals.valueFactory;

    return {
        /**
         * Creates a context for a stream to operate within.
         *
         * @see {@link https://secure.php.net/manual/en/function.stream-context-create.php}
         *
         * @returns {ResourceValue}
         */
        'stream_context_create': internals.typeFunction(
            // FIXME: Add resource return type once supported.
            '?array $options = null, ?array $params = null',
            function () {
                // TODO: Implement me - currently just a stub.
                return valueFactory.createResource('stream-context', {});
            }
        ),

        /**
         * Reads the contents of a stream into a string.
         *
         * @see {@link https://secure.php.net/manual/en/function.stream-get-contents.php}
         *
         * @returns {BooleanValue|StringValue}
         */
        'stream_get_contents': internals.typeFunction(
            // FIXME: Correct signature once resource, constant & union types supported.
            'mixed $stream, ?int $length = null, int $offset = -1',
            function (streamValue, lengthValue, offsetValue) {
                // TODO: Fix signature: "resource $socket"
                var resource,
                    length = lengthValue.getNative(),
                    offset = offsetValue.getNative();

                if (streamValue.getType() !== 'resource') {
                    throw new Error('stream_get_contents() :: Non-resource given - FIXME add parameter type');
                }

                if (streamValue.getResourceType() !== 'stream') {
                    throw new Error('stream_get_contents() :: Non-stream resource given');
                }

                resource = streamValue.getResource();

                return resource.stream.read(length, offset);
            }
        ),

        /**
         * Fetches the metadata for a stream.
         *
         * @see {@link https://secure.php.net/manual/en/function.stream-get-meta-data.php}
         *
         * @returns {ArrayValue}
         */
        'stream_get_meta_data': internals.typeFunction(
            // FIXME: Add resource parameter type once supported.
            'mixed $stream',
            function (streamValue) {
                var metadata = [];

                if (streamValue.getType() !== 'resource') {
                    throw new Error('stream_select() :: Non-resource given - FIXME add parameter type');
                }

                if (streamValue.getResourceType() !== 'stream') {
                    throw new Error('stream_select() :: Non-stream resource given');
                }

                // FIXME: Implement these correctly!
                metadata.timed_out = false;
                metadata.blocked = false;
                metadata.eof = false;
                metadata.stream_type = 'tcp_socket/ssl';
                metadata.mode = 'r+';
                metadata.unread_bytes = 0;
                metadata.seekable = false;

                return valueFactory.createFromNativeArray(metadata);
            }
        ),

        /**
         * Runs an equivalent of the select(...) system call on the given streams.
         *
         * @see {@link https://secure.php.net/manual/en/function.stream-select.php}
         *
         * @returns {IntegerValue|BooleanValue}
         */
        'stream_select': internals.typeFunction(
            '?array &$read, ?array &$write, ?array &$except, ?int $seconds, ?int $microseconds = null',
            function (readReference, writeReference, exceptReference, secondsValue, microsecondsValue) {
                // TODO: Add return type above once supported.

                var readArrayValue = readReference.getValue(),
                    writeArrayValue = writeReference.getValue(),
                    exceptArrayValue = exceptReference.getValue();

                return flow.eachAsync(readArrayValue.getKeys(), function (keyValue) {
                    var element = readArrayValue.getElementByKey(keyValue);

                    return element.getValue().next(function (elementValue) {
                        var resource,
                            stream;

                        if (elementValue.getType() !== 'resource') {
                            throw new Error('stream_select() :: Non-resource given - FIXME add parameter type');
                        }

                        if (elementValue.getResourceType() !== 'stream') {
                            throw new Error('stream_select() :: Non-stream resource given');
                        }

                        resource = elementValue.getResource();
                        stream = resource.stream;

                        if (!stream.isReadable()) {
                            // FIXME: ElementReference.unset() is not decrementing the array length
                            return element.unset();
                        }
                    });
                })
                    .next(function () {
                        var streamsWithActivity = 0;

                        if (readArrayValue.getType() === 'array') {
                            streamsWithActivity += readArrayValue.getLength();
                        }

                        if (writeArrayValue.getType() === 'array') {
                            streamsWithActivity += writeArrayValue.getLength();
                        }

                        if (exceptArrayValue.getType() === 'array') {
                            streamsWithActivity += exceptArrayValue.getLength();
                        }

                        return valueFactory.createFuture(function (resolve) {
                            setTimeout(function () {
                                resolve(streamsWithActivity);
                            }, 5); // FIXME: Use timeout instead of this artificial delay!
                        });
                    })
                    .asValue();
            }
        ),

        'stream_set_blocking': internals.typeFunction(
            'mixed $stream, bool $enable',
            function () {
                // TODO: Fix signature: "resource $stream"

                // FIXME: Actually set the stream's blocking mode!

                return true;
            }
        ),

        'stream_socket_accept': internals.typeFunction(
            'mixed $socket, ?float $timeout = null, string &$peer_name = null',
            function (socketValue, timeoutValue) {
                // TODO: Fix signature: "resource $socket"
                var resource,
                    timeout = timeoutValue.getNative();

                if (socketValue.getType() !== 'resource') {
                    throw new Error('stream_socket_accept() :: Non-resource given - FIXME add parameter type');
                }

                if (socketValue.getResourceType() !== 'stream') {
                    throw new Error('stream_socket_accept() :: Non-stream resource given');
                }

                resource = socketValue.getResource();

                if (resource.type !== 'server') {
                    throw new Error('stream_socket_accept() :: Non-server stream resource given');
                }

                return resource.stream.acceptConnection()
                    .next(function (connectionStream) {
                        return valueFactory.createResource('stream', {
                            type: 'connection',
                            stream: connectionStream
                        });
                    })
                    .asValue();
            }
        ),

        /**
         * Fetches either the local or remote name (address) of a socket connection.
         *
         * @see {@link https://secure.php.net/manual/en/function.stream-socket-get-name.php}
         *
         * @returns {BooleanValue|StringValue}
         */
        'stream_socket_get_name': internals.typeFunction(
            // FIXME: Correct signature once supported.
            'mixed $socket, bool $remote',
            function (socketValue, remoteValue) {
                var name,
                    remote = remoteValue.getNative(),
                    resource,
                    stream;

                if (socketValue.getType() !== 'resource') {
                    throw new Error('stream_socket_get_name() :: Non-resource given - FIXME add parameter type');
                }

                if (socketValue.getResourceType() !== 'stream') {
                    throw new Error('stream_socket_get_name() :: Non-stream resource given');
                }

                resource = socketValue.getResource();
                stream = resource.stream;
                name = remote ? stream.getRemoteName() : stream.getLocalName();

                // stream_socket_get_name() uses false as the result on failure rather than null.
                return name === null ? false : name;
            }
        ),

        'stream_socket_server': internals.typeFunction(
            'string $address, int &$error_code = null, string &$error_message = null, int $flags = 0, ?mixed $context = null',
            function (addressValue) {
                // TODO: Fix signature: "int $flags = STREAM_SERVER_BIND | STREAM_SERVER_LISTEN"
                var address = addressValue.getNative();

                return socketStreamConnector.createListeningServerStream(address)
                    .next(function (serverStream) {
                        return valueFactory.createResource('stream', {
                            type: 'server',
                            stream: serverStream
                        });
                    })
                    .asValue();
            }
        )
    };
};
