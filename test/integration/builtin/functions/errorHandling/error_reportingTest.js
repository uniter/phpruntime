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
    nowdoc = require('nowdoc'),
    tools = require('../../../tools');

describe('PHP "error_reporting" builtin function integration', function () {
    it('should be able to get and set the "error_reporting" INI option', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = error_reporting();
$result[] = ini_get('error_reporting');

$result[] = error_reporting(12345); // Perform a set

$result[] = error_reporting();
$result[] = ini_get('error_reporting');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            22519, // Initial read with error_reporting() after no changes
            22519, // Read with ini_get(...) after no changes
            22519, // Call to error_reporting(...) to set - returns old value
            12345, // Read of new value with error_reporting()
            12345  // Read of new value with ini_get(...)
        ]);
    });

    it('should coerce a non-string "error_reporting" INI option to integer', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

ini_set('error_reporting', '1234.21 and random text');

$result = [];

$result[] = ini_get('error_reporting');
$result[] = error_reporting();

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            '1234.21 and random text', // Read of value with ini_get(...),
            1234                       // Read of value with error_reporting()
        ]);
    });
});
