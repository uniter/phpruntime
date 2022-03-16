/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    errorHandlingExtension = require('../../../../../src/builtin/functions/errorHandling'),
    sinon = require('sinon'),
    tools = require('../../../tools'),
    ErrorConfiguration = require('phpcore/src/Error/ErrorConfiguration'),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "error_reporting" builtin function', function () {
    var errorConfiguration,
        error_reporting,
        levelReference,
        valueFactory;

    beforeEach(function () {
        errorConfiguration = sinon.createStubInstance(ErrorConfiguration);
        levelReference = sinon.createStubInstance(Variable);
        valueFactory = tools.createIsolatedState().getValueFactory();

        errorConfiguration.getErrorReportingLevel.returns(9999);
        errorConfiguration.setErrorReportingLevel.callsFake(function (level) {
            errorConfiguration.getErrorReportingLevel.returns(level);
        });

        error_reporting = errorHandlingExtension({
            errorConfiguration: errorConfiguration,
            valueFactory: valueFactory
        }).error_reporting;
    });

    describe('when a new level is given as an integer', function () {
        beforeEach(function () {
            levelReference.getValue.returns(valueFactory.createInteger(1234));
        });

        it('should set the error reporting level', function () {
            error_reporting(levelReference);

            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledOnce;
            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledWith(1234);
        });

        it('should return the old level', function () {
            var result = error_reporting(levelReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });

    describe('when a new level is given as a string', function () {
        beforeEach(function () {
            levelReference.getValue.returns(valueFactory.createString('4321 & random text'));
        });

        it('should set the error reporting level to the given string value', function () {
            error_reporting(levelReference);

            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledOnce;
            expect(errorConfiguration.setErrorReportingLevel).to.have.been.calledWith('4321 & random text');
        });

        it('should return the old level', function () {
            var result = error_reporting(levelReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });

    describe('when no level is given', function () {
        it('should return the current level', function () {
            var result = error_reporting();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });
});
