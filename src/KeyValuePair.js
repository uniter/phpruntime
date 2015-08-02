/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash');

function KeyValuePair(key, value) {
    this.key = key;
    this.value = value;
}

_.extend(KeyValuePair.prototype, {
    getKey: function () {
        return this.key;
    },

    getValue: function () {
        return this.value;
    }
});

module.exports = KeyValuePair;
