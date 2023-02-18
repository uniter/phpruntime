/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

/**
 * @param {class} ServerStream
 * @param {class} ConnectionStream
 * @param {FutureFactory} futureFactory
 * @constructor
 */
function SocketStreamFactory(ServerStream, ConnectionStream, futureFactory) {
    /**
     * @type {class}
     */
    this.ConnectionStream = ConnectionStream;
    /**
     * @type {FutureFactory}
     */
    this.futureFactory = futureFactory;
    /**
     * @type {class}
     */
    this.ServerStream = ServerStream;
}

_.extend(SocketStreamFactory.prototype, {
    /**
     * Creates a new ConnectionStream.
     *
     * @param {Socket} connectionSocket
     */
    createConnectionStream: function (connectionSocket) {
        var factory = this;

        return new factory.ConnectionStream(factory.futureFactory, connectionSocket);
    },

    /**
     * Creates a new ServerStream.
     *
     * @param {Server} tcpServer
     * @returns {ServerStream}
     */
    createServerStream: function (tcpServer) {
        var factory = this;

        return new factory.ServerStream(factory.futureFactory, factory, tcpServer);
    }
});

module.exports = SocketStreamFactory;
