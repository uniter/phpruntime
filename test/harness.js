/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

/*global WeakMap */
var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

(function () {
    var stubFactories = new WeakMap();

    /**
     * Install an optimized version of `sinon.createStubInstance(...)`
     *
     * @param {class} Class
     * @returns {*}
     */
    sinon.createStubInstance = function (Class) {
        var code,
            propertyName,
            propertyValue,
            stubFactoryFactory;

        if (typeof Class !== 'function') {
            throw new TypeError('createStubInstance() :: The constructor should be a function.');
        }

        if (!stubFactories.has(Class)) {
            code = ['var methodStub, stub = Object.create(prototype);'];

            /*jshint forin:false */
            for (propertyName in Class.prototype) {
                propertyValue = Class.prototype[propertyName];

                if (typeof propertyValue !== 'function') {
                    continue;
                }

                code.push(
                    'methodStub = stub.' + propertyName + ' = sinon.stub();',
                    'methodStub.restore = function () { delete stub["' + propertyName + '"]; };'
                );
            }

            code.push('return stub;');

            stubFactoryFactory = new Function('sinon, prototype', 'return function () {' + code.join('\n') + '};');

            stubFactories.set(Class, stubFactoryFactory(sinon, Class.prototype));
        }

        return stubFactories.get(Class)();
    };
}());
