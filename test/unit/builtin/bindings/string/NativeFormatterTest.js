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
    DirectiveSet = require('../../../../../src/builtin/bindings/string/DirectiveSet'),
    FormatConverter = require('../../../../../src/builtin/bindings/string/FormatConverter'),
    FormatParser = require('../../../../../src/builtin/bindings/string/FormatParser'),
    MissingFormatArgumentException = require('../../../../../src/builtin/bindings/string/Exception/MissingFormatArgumentException'),
    NativeFormatter = require('../../../../../src/builtin/bindings/string/NativeFormatter');

describe('NativeFormatter', function () {
    var formatConverter,
        formatParser,
        formatter;

    beforeEach(function () {
        formatConverter = sinon.createStubInstance(FormatConverter);
        formatParser = sinon.createStubInstance(FormatParser);

        formatter = new NativeFormatter(formatParser, formatConverter);
    });

    describe('format()', function () {
        it('should just return a single ordinary character directive (plain string) unchanged', function () {
            formatParser.parse
                .withArgs('my string with no specs')
                .returns(
                    new DirectiveSet(
                        [
                            {kind: 'ordinary', text: 'my string with no specs'}
                        ],
                        0
                    )
                );

            expect(formatter.format('my string with no specs')).to.equal('my string with no specs');
        });

        it('should just return a single processed conversion specification directive', function () {
            var stringConversionSpecification = {
                kind: 'conversion-specification',
                argumentPosition: 0,
                type: 'string'
            };
            formatParser.parse
                .withArgs('%s')
                .returns(new DirectiveSet([stringConversionSpecification], 1));
            formatConverter.convert
                .withArgs('my string', sinon.match.same(stringConversionSpecification))
                .returns('my string');

            expect(formatter.format('%s', ['my string'])).to.equal('my string');
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
            formatParser.parse
                .withArgs('first %s second %d third')
                .returns(
                    new DirectiveSet(
                        [
                            firstOrdinaryCharacterDirective,
                            stringConversionSpecification,
                            secondOrdinaryCharacterDirective,
                            numberConversionSpecification,
                            thirdOrdinaryCharacterDirective
                        ],
                        2
                    )
                );
            formatConverter.convert
                .withArgs('my string', sinon.match.same(stringConversionSpecification))
                .returns('my string');
            formatConverter.convert
                .withArgs(27, sinon.match.same(numberConversionSpecification))
                .returns('27');

            expect(formatter.format('first %s second %d third', ['my string', 27]))
                .to.equal('first my string second 27 third');
        });

        it('should throw when a conversion specification references a missing arg', function () {
            formatParser.parse
                .withArgs('my string with no specs')
                .returns(
                    new DirectiveSet(
                        [
                            {kind: 'conversion-specification', argumentPosition: 3, type: 'string'}
                        ],
                        10
                    )
                );

            expect(function () {
                formatter.format('my string with no specs');
            }).to.throw(
                MissingFormatArgumentException,
                'Missing argument #1 of 10'
            );
        });

        it('should throw when an invalid kind of directive is returned by the format parser', function () {
            formatParser.parse
                .withArgs('my string')
                .returns(
                    new DirectiveSet(
                        [
                            {kind: 'invalid-directive-kind', someArg: 21}
                        ],
                        0
                    )
                );

            expect(function () {
                formatter.format('my string');
            }).to.throw(Exception, 'Unsupported directive kind "invalid-directive-kind"');
        });
    });
});
