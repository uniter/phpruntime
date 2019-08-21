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
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    Exception = phpCommon.Exception,
    FormatConverter = require('../../../../../src/builtin/bindings/string/FormatConverter'),
    FormatParser = require('../../../../../src/builtin/bindings/string/FormatParser'),
    MissingFormatArgumentException = require('../../../../../src/builtin/bindings/string/Exception/MissingFormatArgumentException'),
    NativeFormatter = require('../../../../../src/builtin/bindings/string/NativeFormatter');

describe('NativeFormatter', function () {
    beforeEach(function () {
        this.formatConverter = sinon.createStubInstance(FormatConverter);
        this.formatParser = sinon.createStubInstance(FormatParser);

        this.formatter = new NativeFormatter(this.formatParser, this.formatConverter);
    });

    describe('format()', function () {
        it('should just return a single ordinary character directive (plain string) unchanged', function () {
            this.formatParser.parse
                .withArgs('my string with no specs')
                .returns([
                    {kind: 'ordinary', text: 'my string with no specs'}
                ]);

            expect(this.formatter.format('my string with no specs')).to.equal('my string with no specs');
        });

        it('should just return a single processed conversion specification directive', function () {
            var stringConversionSpecification = {
                kind: 'conversion-specification',
                argumentPosition: 0,
                type: 'string'
            };
            this.formatParser.parse
                .withArgs('%s')
                .returns([
                    stringConversionSpecification
                ]);
            this.formatConverter.convert
                .withArgs('my string', sinon.match.same(stringConversionSpecification))
                .returns('my string');

            expect(this.formatter.format('%s', ['my string'])).to.equal('my string');
        });

        it('should join a mix of directives together', function () {
            var firstOrdinaryCharacterDirective = {
                    kind: 'ordinary',
                    text: 'first '
                },
                stringConversionSpecification = {
                    kind: 'conversion-specification',
                    argumentPosition: 0,
                    type: 'string'
                },
                secondOrdinaryCharacterDirective = {
                    kind: 'ordinary',
                    text: ' second '
                },
                numberConversionSpecification = {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal'
                },
                thirdOrdinaryCharacterDirective = {
                    kind: 'ordinary',
                    text: ' third'
                };
            this.formatParser.parse
                .withArgs('first %s second %d third')
                .returns([
                    firstOrdinaryCharacterDirective,
                    stringConversionSpecification,
                    secondOrdinaryCharacterDirective,
                    numberConversionSpecification,
                    thirdOrdinaryCharacterDirective
                ]);
            this.formatConverter.convert
                .withArgs('my string', sinon.match.same(stringConversionSpecification))
                .returns('my string');
            this.formatConverter.convert
                .withArgs(27, sinon.match.same(numberConversionSpecification))
                .returns('27');

            expect(this.formatter.format('first %s second %d third', ['my string', 27]))
                .to.equal('first my string second 27 third');
        });

        it('should throw when a conversion specification references a missing arg', function () {
            this.formatParser.parse
                .withArgs('my string with no specs')
                .returns([
                    {kind: 'conversion-specification', argumentPosition: 10, type: 'string'}
                ]);

            expect(function () {
                this.formatter.format('my string with no specs');
            }.bind(this)).to.throw(MissingFormatArgumentException);
        });

        it('should throw when an invalid kind of directive is returned by the format parser', function () {
            this.formatParser.parse
                .withArgs('my string')
                .returns([
                    {kind: 'invalid-directive-kind', someArg: 21}
                ]);

            expect(function () {
                this.formatter.format('my string');
            }.bind(this)).to.throw(Exception, 'Unsupported directive kind "invalid-directive-kind"');
        });
    });
});
