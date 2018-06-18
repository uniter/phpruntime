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

describe('PHP "sprintf" builtin function integration', function () {
    it('should be able to format a string', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$substitute = 'contain';
$result[] = sprintf('I contain no conversion %% specifications');
$result[] = sprintf('I %s string conversion specifications %s', $substitute, 'inside');
$result[] = sprintf('A padded number: %\'~5d and a string: %s in here', 21, '(hello!)');

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            'I contain no conversion % specifications',
            'I contain string conversion specifications inside',
            'A padded number: ~~~21 and a string: (hello!) in here'
        ]);
    });
});
