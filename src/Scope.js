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
    hasOwn = {}.hasOwnProperty,
    Variable = require('./Variable');

function Scope(callStack, valueFactory, thisObject, currentClass) {
    var thisObjectVariable;

    this.currentClass = currentClass;
    this.errorsSuppressed = false;
    this.callStack = callStack;
    this.thisObject = thisObject;
    this.valueFactory = valueFactory;
    this.variables = {};

    if (thisObject) {
        thisObjectVariable = new Variable(callStack, valueFactory, 'this');
        thisObjectVariable.setValue(thisObject);
        this.variables['this'] = thisObjectVariable;
    }
}

_.extend(Scope.prototype, {
    defineVariable: function (name) {
        var scope = this,
            variable = new Variable(scope.callStack, scope.valueFactory, name);

        scope.variables[name] = variable;

        return variable;
    },

    defineVariables: function (names) {
        var scope = this;

        _.each(names, function (name) {
            scope.defineVariable(name);
        });
    },

    expose: function (object, name) {
        var scope = this,
            valueFactory = scope.valueFactory;

        scope.defineVariable(name).setValue(valueFactory.coerce(object));
    },

    getCurrentClass: function () {
        return this.currentClass;
    },

    getThisObject: function () {
        return this.thisObject;
    },

    getVariable: function (name) {
        var scope = this;

        if (!hasOwn.call(scope.variables, name)) {
            // Implicitly define the variable
            scope.variables[name] = new Variable(scope.callStack, scope.valueFactory, name);
        }

        return scope.variables[name];
    },

    suppressErrors: function () {
        this.errorsSuppressed = true;
    },

    suppressesErrors: function () {
        return this.errorsSuppressed;
    },

    unsuppressErrors: function () {
        this.errorsSuppressed = false;
    }
});

module.exports = Scope;
