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
    tools = require('../../../../tools');

describe('PHP "preg_quote" builtin function integration', function () {
    it('should be able to escape all the special regex characters', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

// Using a double-quoted string so that the newline `\n` escape works correctly
$result[] = preg_quote("hello, here\n . \\ + * ? [ ^ ] $ ( ) { } = ! < > | : - \nare all the special chars");

// Specifies a delimiter to also escape
$result[] = preg_quote('here is @ my string ? to escape', '@');

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php);

        expect(module().execute().getNative()).to.deep.equal([
            'hello, here\n \\. \\\\ \\+ \\* \\? \\[ \\^ \\] \\$ \\( \\) \\{ \\} \\= \\! \\< \\> \\| \\: \\- \nare all the special chars',
            'here is \\@ my string \\? to escape'
        ]);
    });
});
