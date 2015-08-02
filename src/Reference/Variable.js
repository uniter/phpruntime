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

function VariableReference(variable) {
    this.variable = variable;
}

_.extend(VariableReference.prototype, {
    getValue: function () {
        return this.variable.getValue();
    },

    setValue: function (value) {
        this.variable.setValue(value);
    }
});

module.exports = VariableReference;
