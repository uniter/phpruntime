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
    tools = require('../../tools');

describe('PHP runtime constants integration', function () {
    it('should support all the PHP constants', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
return [
    'PHP_OS' => PHP_OS,
    'PHP_SAPI' => PHP_SAPI,
    'PHP_VERSION' => PHP_VERSION,
    'PHP_VERSION_ID' => PHP_VERSION_ID
];
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'PHP_OS': 'Uniter',
            'PHP_SAPI': 'cli',
            'PHP_VERSION': '8.3.8',
            'PHP_VERSION_ID': 80308
        });
    });
});
