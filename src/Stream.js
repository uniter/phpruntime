/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

function Stream() {
    EventEmitter.call(this);

    this.data = '';
}

util.inherits(Stream, EventEmitter);

_.extend(Stream.prototype, {
    read: function (length) {
        var data,
            stream = this;

        if (!length && length !== 0) {
            data = stream.data;
            stream.data = '';
        } else {
            data = stream.data.substr(0, length);
            stream.data = stream.data.substr(length);
        }

        return data;
    },

    readAll: function () {
        var stream = this;

        return stream.read(stream.data.length);
    },

    write: function (data) {
        var stream = this;

        stream.data += data;
        stream.emit('data', data);
    }
});

module.exports = Stream;
