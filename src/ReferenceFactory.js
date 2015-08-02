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
    NullReference = require('./Reference/Null');

function ReferenceFactory(valueFactory) {
    this.valueFactory = valueFactory;
}

_.extend(ReferenceFactory.prototype, {
    createNull: function () {
        return new NullReference(this.valueFactory);
    }
});

module.exports = ReferenceFactory;
