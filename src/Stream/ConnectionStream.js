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
    phpCommon = require('phpcommon'),
    Exception = phpCommon.Exception;

/**
 * @param {FutureFactory} futureFactory
 * @param {Socket} connectionSocket
 * @constructor
 */
function ConnectionStream(futureFactory, connectionSocket) {
    var stream = this;

    /**
     * Received data that has not yet been read.
     *
     * @type {string}
     */
    this.bufferedData = '';
    /**
     * @type {boolean}
     */
    this.closed = false;
    /**
     * @type {Socket}
     */
    this.connectionSocket = connectionSocket;
    /**
     * @type {FutureFactory}
     */
    this.futureFactory = futureFactory;

    connectionSocket.on('close', function () {
        stream.closed = true;
    });

    connectionSocket.on('data', function (chunk) {
        chunk = String(chunk);

        stream.bufferedData += chunk;
    });
}

_.extend(ConnectionStream.prototype, {
    /**
     * Closes the connection. Returns a future that will be resolved when the connection is fully closed.
     *
     * @returns {Future<boolean>}
     */
    close: function () {
        var stream = this;

        return stream.futureFactory.createFuture(function (resolve) {
            if (stream.closed) {
                // Already closed, nothing to do.
                resolve(false);
                return;
            }

            stream.connectionSocket.on('close', function () {
                resolve(true);
            });

            // The connection will only be fully closed once we receive the "close" event just above.
            stream.connectionSocket.end();
        });
    },

    /**
     * Fetches the local name (address) of the socket.
     *
     * @returns {string|null}
     */
    getLocalName: function () {
        var connectionSocket = this.connectionSocket;

        return connectionSocket.localAddress + ':' + connectionSocket.localPort;
    },

    /**
     * Fetches the remote name (address) of the socket.
     *
     * @returns {string|null}
     */
    getRemoteName: function () {
        var connectionSocket = this.connectionSocket;

        return connectionSocket.remoteAddress + ':' + connectionSocket.remotePort;
    },

    /**
     * Whether the connection stream is closed.
     *
     * @returns {boolean}
     */
    isEof: function () {
        var stream = this;

        return stream.closed;
    },

    /**
     * Determines whether this stream is readable. For socket connections,
     * that is whether there is data available in the buffer to read.
     *
     * @returns {boolean}
     */
    isReadable: function () {
        var stream = this;

        return !stream.closed && stream.bufferedData.length > 0;
    },

    /**
     * Reads received data from the stream.
     *
     * @param {number|null} length
     * @param {number} offset
     * @returns {string}
     */
    read: function (length, offset) {
        var data,
            stream = this;

        if (offset >= 0) {
            throw new Exception('ConnectionStream.read() :: Seeking not yet supported');
        }

        if (length === null || length < 0) {
            data = stream.bufferedData;

            stream.bufferedData = '';

            return data;
        }

        data = stream.bufferedData.substring(0, length);
        stream.bufferedData = stream.bufferedData.substring(length + 1);

        return data;
    },

    /**
     * Writes the given data out to the connection. Returns a future that will be resolved
     * when the data is flushed to the kernel.
     *
     * @param {string} data
     * @returns {Future}
     */
    write: function (data) {
        var stream = this;

        return stream.futureFactory.createFuture(function (resolve) {
            if (stream.closed) {
                // FIXME: Should be caught higher up and raise eg.
                //        "fwrite(): supplied resource is not a valid stream resource"
                throw new Exception('Cannot write to a closed socket');
            }

            stream.connectionSocket.write(data, function () {
                resolve();
            });
        });
    }
});

module.exports = ConnectionStream;
