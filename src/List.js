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

function List(elements) {
    this.elements = elements;
}

_.extend(List.prototype, {
    setValue: function (value) {
        var listElements = this.elements;

        if (value.getType() !== 'array') {
            throw new Error('Unsupported');
        }

        _.each(listElements, function (reference, index) {
            reference.setValue(value.getElementByIndex(index).getValue());
        });

        return value;
    }
});

module.exports = List;
