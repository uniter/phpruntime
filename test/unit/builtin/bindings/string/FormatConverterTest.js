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
    FormatConverter = require('../../../../../src/builtin/bindings/string/FormatConverter');

describe('FormatConverter', function () {
    beforeEach(function () {
        this.converter = new FormatConverter();
    });

    describe('convert()', function () {
        describe('for a string conversion specification', function () {
            it('should just return the string value unchanged', function () {
                expect(this.converter.convert('my string here', {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'string'
                }))
                    .to.equal('my string here');
            });
        });

        describe('for a signed decimal conversion specification', function () {
            it('should add a leading plus sign when specified and positive', function () {
                expect(this.converter.convert(21, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal',
                    showPositiveSign: true,
                    paddingCharacter: ' ',
                    alignmentSpecifier: 'right',
                    widthSpecifier: 0,
                    precisionSpecifier: 0
                }))
                    .to.equal('+21');
            });

            it('should not add a leading plus sign when specified but negative', function () {
                expect(this.converter.convert(-21, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal',
                    showPositiveSign: true,
                    paddingCharacter: ' ',
                    alignmentSpecifier: 'right',
                    widthSpecifier: 0,
                    precisionSpecifier: 0
                }))
                    .to.equal('-21');
            });

            it('should not add a leading plus sign when specified but zero', function () {
                expect(this.converter.convert(0, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal',
                    showPositiveSign: true,
                    paddingCharacter: ' ',
                    alignmentSpecifier: 'right',
                    widthSpecifier: 0,
                    precisionSpecifier: 0
                }))
                    .to.equal('0');
            });

            it('should not add a leading plus sign when negative and not specified', function () {
                expect(this.converter.convert(-27, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal',
                    showPositiveSign: false,
                    paddingCharacter: ' ',
                    alignmentSpecifier: 'right',
                    widthSpecifier: 0,
                    precisionSpecifier: 0
                }))
                    .to.equal('-27');
            });

            it('should truncate/round down a float', function () {
                expect(this.converter.convert(123.889, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal',
                    showPositiveSign: false,
                    paddingCharacter: ' ',
                    alignmentSpecifier: 'right',
                    widthSpecifier: 0,
                    precisionSpecifier: 0
                }))
                    .to.equal('123');
            });

            it('should support padding width and left-alignment/justification', function () {
                expect(this.converter.convert(4567, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal',
                    showPositiveSign: false,
                    paddingCharacter: '#',
                    alignmentSpecifier: 'left',
                    widthSpecifier: 10,
                    precisionSpecifier: 0
                }))
                    .to.equal('4567######');
            });

            it('should support padding width and right-alignment/justification', function () {
                expect(this.converter.convert(1234, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'signed-decimal',
                    showPositiveSign: false,
                    paddingCharacter: '#',
                    alignmentSpecifier: 'right',
                    widthSpecifier: 12,
                    precisionSpecifier: 0
                }))
                    .to.equal('########1234');
            });
        });

        it('should throw when the conversion specification\'s type is not supported', function () {
            expect(function () {
                this.converter.convert(21, {
                    kind: 'conversion-specification',
                    argumentPosition: 1,
                    type: 'unsupported-type'
                });
            }.bind(this)).to.throw('Unsupported conversion specification type "unsupported-type"');
        });
    });
});
