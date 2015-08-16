/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = require('pausable').executeSync([require], function (require) {
    var _ = require('lodash'),
        util = require('util'),
        StringValue = require('./String');

    function BarewordStringValue(factory, callStack, value) {
        StringValue.call(this, factory, callStack, value);
    }

    util.inherits(BarewordStringValue, StringValue);

    _.extend(BarewordStringValue.prototype, {
        call: function (args, namespaceOrNamespaceScope) {
            return namespaceOrNamespaceScope.getFunction(this.value).apply(null, args);
        }
    });

    return BarewordStringValue;
});
