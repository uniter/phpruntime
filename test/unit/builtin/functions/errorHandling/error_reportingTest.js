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
    ErrorConfiguration = require('phpcore/src/Error/ErrorConfiguration'),
    ValueFactory = require('phpcore/src/ValueFactory').sync(),
    Variable = require('phpcore/src/Variable').sync();

describe('PHP "error_reporting" builtin function', function () {
    beforeEach(function () {
        this.errorConfiguration = sinon.createStubInstance(ErrorConfiguration);
        this.levelReference = sinon.createStubInstance(Variable);
        this.valueFactory = new ValueFactory();

        this.errorConfiguration.getErrorReportingLevel.returns(9999);
        this.errorConfiguration.setErrorReportingLevel.callsFake(function (level) {
            this.errorConfiguration.getErrorReportingLevel.returns(level);
        }.bind(this));

        this.error_reporting = errorHandlingExtension({
            errorConfiguration: this.errorConfiguration,
            valueFactory: this.valueFactory
        }).error_reporting;
    });

    describe('when a new level is given as an integer', function () {
        beforeEach(function () {
            this.levelReference.getValue.returns(this.valueFactory.createInteger(1234));
        });

        it('should set the error reporting level', function () {
            this.error_reporting(this.levelReference);

            expect(this.errorConfiguration.setErrorReportingLevel).to.have.been.calledOnce;
            expect(this.errorConfiguration.setErrorReportingLevel).to.have.been.calledWith(1234);
        });

        it('should return the old level', function () {
            var result = this.error_reporting(this.levelReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });

    describe('when a new level is given as a string', function () {
        beforeEach(function () {
            this.levelReference.getValue.returns(this.valueFactory.createString('4321 & random text'));
        });

        it('should set the error reporting level to the given string value', function () {
            this.error_reporting(this.levelReference);

            expect(this.errorConfiguration.setErrorReportingLevel).to.have.been.calledOnce;
            expect(this.errorConfiguration.setErrorReportingLevel).to.have.been.calledWith('4321 & random text');
        });

        it('should return the old level', function () {
            var result = this.error_reporting(this.levelReference);

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });

    describe('when no level is given', function () {
        it('should return the current level', function () {
            var result = this.error_reporting();

            expect(result.getType()).to.equal('int');
            expect(result.getNative()).to.equal(9999);
        });
    });
});
