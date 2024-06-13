/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    expect = require('chai').expect,
    FormatParser = require('../../../../../src/builtin/bindings/string/FormatParser');

describe('FormatParser', function () {
    var parser;

    beforeEach(function () {
        parser = new FormatParser();
    });

    describe('parse()', function () {
        _.forOwn({
            'empty format string - no directives at all': {
                format: '',
                expectedDirectives: [],
                expectedParameterCount: 0
            },
            'plain string - ordinary characters only, no conversion specifications': {
                format: 'hello world!',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello world!'}
                ],
                expectedParameterCount: 0
            },
            'with isolated escaped literal percentage character': {
                format: 'hello %% world!',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello % world!'}
                ],
                expectedParameterCount: 0
            },
            'with escaped string spec - only a single percentage char should be kept': {
                format: 'hello %%s world!',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello %s world!'}
                ],
                expectedParameterCount: 0
            },
            'with string spec followed by escaped string spec - only a single percentage char should be kept': {
                format: 'hello %s there %%s world!',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {kind: 'conversion-specification', argumentPosition: 0, type: 'string'},
                    {kind: 'ordinary', text: ' there %s world!'}
                ],
                expectedParameterCount: 1
            },
            'with escaped string spec followed by string spec - only a single percentage char should be kept': {
                format: 'hello %%s there %s world!',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello %s there '},
                    {kind: 'conversion-specification', argumentPosition: 0, type: 'string'},
                    {kind: 'ordinary', text: ' world!'}
                ],
                expectedParameterCount: 1
            },
            'with just a string conversion specification': {
                format: '%s',
                expectedDirectives: [
                    {kind: 'conversion-specification', argumentPosition: 0, type: 'string'}
                ],
                expectedParameterCount: 1
            },
            'a string conversion specification surrounded by ordinary characters': {
                format: 'hello there %s world!',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello there '},
                    {kind: 'conversion-specification', argumentPosition: 0, type: 'string'},
                    {kind: 'ordinary', text: ' world!'}
                ],
                expectedParameterCount: 1
            },
            'an integer padded with hashes': {
                format: 'this is %\'#9d my format string',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'this is '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: '#',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 9,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' my format string'}
                ],
                expectedParameterCount: 1
            },
            'an integer padded with hashes, 4 decimal places, with the pad char specified after the period': {
                format: 'this is %9.#4d my format string',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'this is '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: '#',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 9,
                        precisionSpecifier: 4
                    },
                    {kind: 'ordinary', text: ' my format string'}
                ],
                expectedParameterCount: 1
            },
            'a locale-aware floating-point number padded with hashes, showing positive sign, left-justified, 12 decimal places': {
                format: 'this is %+\'#-20.12f my format string',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'this is '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'locale-aware-float',
                        showPositiveSign: true,
                        paddingCharacter: '#',
                        alignmentSpecifier: 'left',
                        widthSpecifier: 20,
                        precisionSpecifier: 12
                    },
                    {kind: 'ordinary', text: ' my format string'}
                ],
                expectedParameterCount: 1
            },
            'with first and second arguments swapped, and first argument added again implicitly': {
                format: 'I am %2$d and I am %1$d! To finish, %d.',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'I am '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 1,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' and I am '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: '! To finish, '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: '.'}
                ],
                expectedParameterCount: 2
            },
            'with first argument repeated explicitly, and first argument added again implicitly': {
                format: 'I am %1$d and I am %1$d! To finish, %d.',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'I am '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' and I am '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: '! To finish, '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: '.'}
                ],
                expectedParameterCount: 1
            },
            'with high explicit argument number alongside other specifications': {
                format: 'I am %21$d and I am %1$d! To finish, %d.',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'I am '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 20,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' and I am '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: '! To finish, '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: '.'}
                ],
                expectedParameterCount: 21
            },
            'with high explicit argument number alone': {
                format: 'I am %21$d!',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'I am '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 20,
                        type: 'signed-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: '!'}
                ],
                expectedParameterCount: 21
            },
            'with binary number conversion specification': {
                format: 'hello %b world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'binary',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with ASCII character conversion specification': {
                format: 'hello %c world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'ascii-character',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with lowercase exponent conversion specification': {
                format: 'hello %e world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'lower-exponent',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with uppercase exponent conversion specification': {
                format: 'hello %E world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'upper-exponent',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with locale-aware floating-point number conversion specification': {
                format: 'hello %f world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'locale-aware-float',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with non-locale-aware floating-point number conversion specification': {
                format: 'hello %F world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'locale-unaware-float',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with lower-case-exponent-or-float conversion specification': {
                format: 'hello %g world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'lower-exponent-or-float',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with upper-case-exponent-or-float conversion specification': {
                format: 'hello %G world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'upper-exponent-or-float',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with octal number conversion specification': {
                format: 'hello %o world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'octal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with unsigned decimal conversion specification': {
                format: 'hello %u world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'unsigned-decimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with lowercase hexadecimal number conversion specification': {
                format: 'hello %x world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'lower-hexadecimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            },
            'with uppercase hexadecimal number conversion specification': {
                format: 'hello %X world',
                expectedDirectives: [
                    {kind: 'ordinary', text: 'hello '},
                    {
                        kind: 'conversion-specification',
                        argumentPosition: 0,
                        type: 'upper-hexadecimal',
                        showPositiveSign: false,
                        paddingCharacter: ' ',
                        alignmentSpecifier: 'right',
                        widthSpecifier: 0,
                        precisionSpecifier: 0
                    },
                    {kind: 'ordinary', text: ' world'}
                ],
                expectedParameterCount: 1
            }
        }, function (scenario, description) {
            describe(description, function () {
                it('should return a DirectiveSet with the expected list of directives', function () {
                    var directiveSet = parser.parse(scenario.format);

                    expect(directiveSet.getDirectives()).to.deep.equal(scenario.expectedDirectives);
                });

                it('should return a DirectiveSet with the expected parameter count', function () {
                    var directiveSet = parser.parse(scenario.format);

                    expect(directiveSet.getParameterCount()).to.equal(scenario.expectedParameterCount);
                });
            });
        });
    });
});
