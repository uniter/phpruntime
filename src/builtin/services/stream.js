/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var FUTURE_FACTORY = 'future_factory',
    SOCKET_STREAM_FACTORY = 'socket_stream_factory',

    ConnectionStream = require('../../Stream/ConnectionStream'),
    ServerStream = require('../../Stream/ServerStream'),
    SocketStreamConnector = require('../../Stream/SocketStreamConnector'),
    SocketStreamFactory = require('../../Stream/SocketStreamFactory');

/**
 * Provides the set of services for streams.
 *
 * @param {ServiceInternals} internals
 */
module.exports = function (internals) {
    var get = internals.getServiceFetcher();

    return {
        'socket_stream_connector': function () {
            return new SocketStreamConnector(get(FUTURE_FACTORY), get(SOCKET_STREAM_FACTORY));
        },

        'socket_stream_factory': function () {
            return new SocketStreamFactory(ServerStream, ConnectionStream, get(FUTURE_FACTORY));
        }
    };
};
