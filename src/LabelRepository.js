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

function LabelRepository() {
    EventEmitter.call(this);

    this.foundLabels = {};
    this.labels = {};
    this.pendingLabels = {};
}

util.inherits(LabelRepository, EventEmitter);

_.extend(LabelRepository.prototype, {
    addPending: function (label) {
        var repository = this;

        repository.labels[label] = true;
        repository.pendingLabels[label] = true;
        repository.emit('pending label', label);
    },

    found: function (label) {
        var repository = this;

        repository.foundLabels[label] = true;
        repository.labels[label] = true;
        delete repository.pendingLabels[label];
        repository.emit('found label', label);
    },

    getLabels: function () {
        return Object.keys(this.labels);
    },

    hasBeenFound: function (label) {
        var repository = this;

        return repository.foundLabels[label] === true;
    },

    hasPending: function () {
        return Object.keys(this.pendingLabels).length > 0;
    },

    isPending: function (label) {
        return this.pendingLabels[label] === true;
    }
});

module.exports = LabelRepository;
