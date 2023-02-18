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
 * @param {SocketStreamFactory} socketStreamFactory
 * @constructor
 */
function SocketStreamConnector(
    futureFactory,
    socketStreamFactory
) {
    /**
     * @type {FutureFactory}
     */
    this.futureFactory = futureFactory;
    /**
     * @type {SocketStreamFactory}
     */
    this.socketStreamFactory = socketStreamFactory;
    /**
     * @type {TcpServerFactory|null}
     */
    this.tcpServerFactory = null;
}

_.extend(SocketStreamConnector.prototype, {
    /**
     * Creates a ServerStream listening on the given address descriptor.
     *
     * @param {string} address
     * @returns {Future}
     */
    createListeningServerStream: function (address) {
        var connector = this;

        return connector.futureFactory.createFuture(function (resolve, reject) {
            var host,
                match = address.match(/^(\w+):\/\/([^:]+):(\d+)$/),
                port,
                stream,
                tcpServer,
                transport;

            if (!match) {
                throw new Exception('Unable to parse address: "' + address + '"');
            }

            transport = match[1].toLowerCase();
            host = match[2];
            port = match[3];

            if (transport !== 'tcp') {
                throw new Exception('Only "tcp" transport is supported for now, "' + transport + '" given');
            }

            tcpServer = connector.tcpServerFactory.createServer();
            stream = connector.socketStreamFactory.createServerStream(tcpServer);

            // Set the server listening and resolve the future on success.
            tcpServer.listen(port, host, function () {
                resolve(stream);
            });

            // Ensure any listen setup failures reject the future.
            tcpServer.on('error', function (error) {
                reject(error);
            });
        });
    },

    /**
     * Injects the TcpServerFactory service.
     * Intended to be called by an initialiser and passed the relevant "tcp_server_factory" binding.
     *
     * @param {TcpServerFactory} tcpServerFactory
     */
    setTcpServerFactory: function (tcpServerFactory) {
        this.tcpServerFactory = tcpServerFactory;
    }
});

module.exports = SocketStreamConnector;
