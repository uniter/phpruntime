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

function StaticPropertyReference(classObject, name, visibility, value) {
    this.classObject = classObject;
    this.name = name;
    this.reference = null;
    this.value = value;
    this.visibility = visibility;
}

_.extend(StaticPropertyReference.prototype, {
    getName: function () {
        return this.name;
    },

    getValue: function () {
        var property = this;

        return property.value ? property.value : property.reference.getValue();
    },

    getVisibility: function () {
        return this.visibility;
    },

    isReference: function () {
        return !!this.reference;
    },

    setReference: function (reference) {
        var property = this;

        property.reference = reference;
        property.value = null;
    },

    setValue: function (value) {
        var property = this;

        if (property.reference) {
            property.reference.setValue(value);
        } else {
            property.value = value.getForAssignment();
        }
    }
});

module.exports = StaticPropertyReference;
