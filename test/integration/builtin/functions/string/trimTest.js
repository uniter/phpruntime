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

describe('PHP "trim" builtin function integration', function () {
    it('should be able to trim a string', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['with default character mask'] = trim("\t\n\r\0\x0b    middle    \t\n\r\0\x0b");
$result['with custom character mask'] = trim("zzz\t\n\r\0\x0b    middle    xyz", 'xzy');
$result['with character mask using regex special chars'] = trim("]yy]y my string yyy", ']y');

$result['relying on coercion'] = trim(true);

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal({
            'with default character mask': 'middle',
            'with custom character mask': '\t\n\r\0\x0b    middle    ',
            'with character mask using regex special chars': ' my string ',
            'relying on coercion': '1'
        });
    });
});
