/*
 * PHPRuntime - PHP environment runtime components.
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license.
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    tools = require('../../../tools');

describe('PHP ctype functions integer handling integration', function () {
    it('should handle integers correctly for all ctype functions', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// Test with integers between -128 and 255 (ASCII values).
$result['ctype_alnum(65)'] = ctype_alnum(65); // Maps to 'A' - should be true.
$result['ctype_alnum(-65)'] = ctype_alnum(-65); // Maps to chr(191) - should be false.
$result['ctype_alnum(-49)'] = ctype_alnum(-49); // Maps to chr(207) ('Ï') - should be false.
$result['ctype_alnum(-48)'] = ctype_alnum(-48); // Maps to chr(208) - should be false.

// Test with very negative numbers that should be treated as their string representation.
$result['ctype_alnum(-257)'] = ctype_alnum(-257); // Should be treated as string "-257" - should be false.
$result['ctype_digit(-257)'] = ctype_digit(-257); // Should be treated as string "-257" - should be false.
$result['ctype_digit(-513)'] = ctype_digit(-513); // Should be treated as string "-513" - should be false.

$result['ctype_alpha(65)'] = ctype_alpha(65); // Maps to 'A' - should be true.
$result['ctype_alpha(-65)'] = ctype_alpha(-65); // Maps to chr(191) - should be false.
$result['ctype_alpha(-49)'] = ctype_alpha(-49); // Maps to chr(207) ('Ï') - should be false.
$result['ctype_alpha(-97)'] = ctype_alpha(-97); // Maps to chr(159) - should be false.

$result['ctype_cntrl(13)'] = ctype_cntrl(13); // Maps to carriage return - should be true.
$result['ctype_cntrl(-13)'] = ctype_cntrl(-13); // Maps to chr(243) - should be false.
$result['ctype_cntrl(-1)'] = ctype_cntrl(-1); // Maps to chr(255) (DEL) - should be false.

$result['ctype_digit(48)'] = ctype_digit(48); // Maps to '0' - should be true.
$result['ctype_digit(-48)'] = ctype_digit(-48); // Maps to chr(208) - should be false.
$result['ctype_digit(-208)'] = ctype_digit(-208); // Maps to chr(48) ('0') - should be true.

$result['ctype_graph(33)'] = ctype_graph(33); // Maps to '!' - should be true.
$result['ctype_graph(-33)'] = ctype_graph(-33); // Maps to chr(223) - should be false.
$result['ctype_graph(-223)'] = ctype_graph(-223); // Maps to chr(33) ('!') - should be true.

$result['ctype_lower(97)'] = ctype_lower(97); // Maps to 'a' - should be true.
$result['ctype_lower(-97)'] = ctype_lower(-97); // Maps to chr(159) - should be false.
$result['ctype_lower(-159)'] = ctype_lower(-159); // Maps to chr(97) ('a') - should be true.

$result['ctype_print(32)'] = ctype_print(32); // Maps to space - should be true.
$result['ctype_print(-32)'] = ctype_print(-32); // Maps to chr(224) - should be false.
$result['ctype_print(-224)'] = ctype_print(-224); // Maps to chr(32) (space) - should be true.

$result['ctype_punct(33)'] = ctype_punct(33); // Maps to '!' - should be true.
$result['ctype_punct(-33)'] = ctype_punct(-33); // Maps to chr(223) - should be false.
$result['ctype_punct(-223)'] = ctype_punct(-223); // Maps to chr(33) ('!') - should be true.

$result['ctype_space(32)'] = ctype_space(32); // Maps to space - should be true.
$result['ctype_space(-32)'] = ctype_space(-32); // Maps to chr(224) - should be false.
$result['ctype_space(-224)'] = ctype_space(-224); // Maps to chr(32) (space) - should be true.

$result['ctype_upper(65)'] = ctype_upper(65); // Maps to 'A' - should be true.
$result['ctype_upper(-65)'] = ctype_upper(-65); // Maps to chr(191) - should be false.
$result['ctype_upper(-191)'] = ctype_upper(-191); // Maps to chr(65) ('A') - should be true.

$result['ctype_xdigit(48)'] = ctype_xdigit(48); // Maps to '0' - should be true.
$result['ctype_xdigit(-48)'] = ctype_xdigit(-48); // Maps to chr(208) - should be false.
$result['ctype_xdigit(-208)'] = ctype_xdigit(-208); // Maps to chr(48) ('0') - should be true.

// Test with integers outside the ASCII range.
$result['ctype_alnum(256)'] = ctype_alnum(256);
$result['ctype_alpha(256)'] = ctype_alpha(256);
$result['ctype_cntrl(256)'] = ctype_cntrl(256);
$result['ctype_digit(256)'] = ctype_digit(256);
$result['ctype_graph(256)'] = ctype_graph(256);
$result['ctype_lower(256)'] = ctype_lower(256);
$result['ctype_print(256)'] = ctype_print(256);
$result['ctype_print(-400)'] = ctype_print(256);
$result['ctype_punct(256)'] = ctype_punct(256);
$result['ctype_space(256)'] = ctype_space(256);
$result['ctype_upper(256)'] = ctype_upper(256);
$result['ctype_xdigit(256)'] = ctype_xdigit(256);

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            // ASCII values.
            'ctype_alnum(65)': true, // Maps to 'A' - should be true.
            'ctype_alnum(-65)': false, // Maps to chr(191) - should be false.
            'ctype_alnum(-49)': false, // Maps to chr(207) ('Ï') - should be false.
            'ctype_alnum(-48)': false, // Maps to chr(208) - should be false.

            // Negative numbers below -128 should be treated as strings.
            'ctype_alnum(-257)': false, // Should be treated as string "-257" - should be false.
            'ctype_digit(-257)': false, // Should be treated as string "-257" - should be false.
            'ctype_digit(-513)': false, // Should be treated as string "-513" - should be false.

            'ctype_alpha(65)': true, // Maps to 'A' - should be true.
            'ctype_alpha(-65)': false, // Maps to chr(191) - should be false.
            'ctype_alpha(-49)': false, // Maps to chr(207) ('Ï') - should be false.
            'ctype_alpha(-97)': false, // Maps to chr(159) - should be false.

            'ctype_cntrl(13)': true, // Maps to carriage return - should be true.
            'ctype_cntrl(-13)': false, // Maps to chr(243) - should be false.
            'ctype_cntrl(-1)': false, // Maps to chr(255) (DEL) - should be false.

            'ctype_digit(48)': true, // Maps to '0' - should be true.
            'ctype_digit(-48)': false, // Maps to chr(208) - should be false.
            'ctype_digit(-208)': true, // Maps to chr(48) ('0') - should be true.

            'ctype_graph(33)': true, // Maps to '!' - should be true.
            'ctype_graph(-33)': false, // Maps to chr(223) - should be false.
            'ctype_graph(-223)': true, // Maps to chr(33) ('!') - should be true.

            'ctype_lower(97)': true, // Maps to 'a' - should be true.
            'ctype_lower(-97)': false, // Maps to chr(159) - should be false.
            'ctype_lower(-159)': true, // Maps to chr(97) ('a') - should be true.

            'ctype_print(32)': true, // Maps to space - should be true.
            'ctype_print(-32)': false, // Maps to chr(224) - should be false.
            'ctype_print(-224)': true, // Maps to chr(32) (space) - should be true.

            'ctype_punct(33)': true, // Maps to '!' - should be true.
            'ctype_punct(-33)': false, // Maps to chr(223) - should be false.
            'ctype_punct(-223)': true, // Maps to chr(33) ('!') - should be true.

            'ctype_space(32)': true, // Maps to space - should be true.
            'ctype_space(-32)': false, // Maps to chr(224) - should be false.
            'ctype_space(-224)': true, // Maps to chr(32) (space) - should be true.

            'ctype_upper(65)': true, // Maps to 'A' - should be true.
            'ctype_upper(-65)': false, // Maps to chr(191) - should be false.
            'ctype_upper(-191)': true, // Maps to chr(65) ('A') - should be true.

            'ctype_xdigit(48)': true, // Maps to '0' - should be true.
            'ctype_xdigit(-48)': false, // Maps to chr(208) - should be false.
            'ctype_xdigit(-208)': true, // Maps to chr(48) ('0') - should be true.

            // Integers outside ASCII range.
            'ctype_alnum(256)': true, // "256" contains digits.
            'ctype_alpha(256)': false, // "256" contains no letters.
            'ctype_cntrl(256)': false, // "256" contains no control chars.
            'ctype_digit(256)': true, // "256" contains only digits.
            'ctype_graph(256)': true, // "256" contains printable non-space chars.
            'ctype_lower(256)': false, // "256" contains no lowercase letters.
            'ctype_print(256)': true, // "256" contains printable chars.
            'ctype_print(-400)': true, // "-400" contains printable chars.
            'ctype_punct(256)': false, // "256" contains no punctuation.
            'ctype_space(256)': false, // "256" contains no whitespace.
            'ctype_upper(256)': false, // "256" contains no uppercase letters.
            'ctype_xdigit(256)': true // "256" contains hex digits.
        });
    });
});
