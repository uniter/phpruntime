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
    Exception = phpCommon.Exception,
    /**
     * Accepts a pending connection with a pending acceptor, if there is one.
     *
     * @param {ServerStream} stream
     */
    acceptConnection = function (stream) {
        var acceptor,
            connectionSocket,
            connectionStream;

        if (stream.connectionSocketBacklog.length === 0) {
            return;
        }

        if (stream.acceptBacklog.length === 0) {
            return;
        }

        acceptor = stream.acceptBacklog.shift();
        connectionSocket = stream.connectionSocketBacklog.shift();
        connectionStream = stream.socketStreamFactory.createConnectionStream(connectionSocket);

        acceptor(connectionStream);
    };

/**
 * @param {FutureFactory} futureFactory
 * @param {SocketStreamFactory} socketStreamFactory
 * @param {Server} tcpServer
 * @constructor
 */
function ServerStream(futureFactory, socketStreamFactory, tcpServer) {
    var stream = this;

    /**
     * @type {Function[]}
     */
    this.acceptBacklog = [];
    /**
     * @type {boolean}
     */
    this.closed = false;
    /**
     * @type {Socket[]}
     */
    this.connectionSocketBacklog = [];
    /**
     * @type {FutureFactory}
     */
    this.futureFactory = futureFactory;
    /**
     * @type {SocketStreamFactory}
     */
    this.socketStreamFactory = socketStreamFactory;
    /**
     * @type {Server}
     */
    this.tcpServer = tcpServer;

    tcpServer.on('close', function () {
        stream.closed = true;
    });

    tcpServer.on('connection', function (connectionSocket) {
        stream.connectionSocketBacklog.push(connectionSocket);

        // Try to accept the connection: if there are no pending acceptors it will be queued.
        acceptConnection(stream);
    });
}

_.extend(ServerStream.prototype, {
    /**
     * Accepts a connection to the server.
     *
     * @returns {Future}
     */
    acceptConnection: function () {
        var stream = this;

        return stream.futureFactory.createFuture(function (resolve, reject) {
            if (stream.closed) {
                reject(new Exception('ServerStream.acceptConnection() :: Server is closed'));
                return;
            }

            stream.acceptBacklog.push(resolve);

            // Try to get a connection to accept: if there are no pending connections this acceptor will be queued.
            acceptConnection(stream);
        });
    },

    /**
     * Closes the server, stopping it from accepting any new connections.
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

            stream.tcpServer.on('close', function () {
                resolve(true);
            });

            // TODO: Empty the connection & acceptor backlogs?

            // The server will only be fully closed once we receive the "close" event just above.
            stream.tcpServer.close();
        });
    },

    /**
     * Fetches the local name (address) of the socket. For a server this is its listening address.
     *
     * @returns {string|null}
     */
    getLocalName: function () {
        var address = this.tcpServer.address();

        if (typeof address !== 'object') {
            throw new Exception('ServerStream.getLocalName() :: Only TCP sockets supported');
        }

        return address.address + ':' + address.port;
    },

    /**
     * Fetches the remote name (address) of the socket. For a server this is never defined.
     *
     * @returns {string|null}
     */
    getRemoteName: function () {
        return null;
    },

    /**
     * Whether the server stream is closed.
     *
     * @returns {boolean}
     */
    isEof: function () {
        return this.closed;
    },

    /**
     * Determines whether this stream is readable. For socket servers,
     * that is whether there are pending connections in the backlog.
     *
     * @returns {boolean}
     */
    isReadable: function () {
        var stream = this;

        return !stream.closed && stream.connectionSocketBacklog.length > 0;
    },

    /**
     * Server streams cannot be read from directly.
     *
     * @returns {boolean}
     */
    read: function () {
        return false;
    }
});

module.exports = ServerStream;
