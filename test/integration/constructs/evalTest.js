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
    tools = require('../tools'),
    evalAddon = require('../../../src/addon/eval');

describe('PHP eval(...) construct integration', function () {
    it('should allow evaluating expressions with access to the calling scope', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$myVar = 'out here';

$result = [];

// Check a simple scalar value can be returned
$result[] = eval('return 21;');

// Check that variables in the calling scope can be read from
$result[] = eval('return "and " . $myVar;');

// Check that NULL is returned when `return` is not used
$result[] = eval('new stdClass;');

// Check that variables in the calling scope may be written to
eval('$myVar = "from in here";');
$result[] = $myVar;

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, null, php),
            engine;

        syncRuntime.install(evalAddon);
        engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            21,
            'and out here',
            null,
            'from in here'
        ]);
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should correctly raise a ParseError when invalid syntax is given', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

function myFunction() {
    global $result;

    try {
        eval("\n\n not @! valid");
    } catch (Throwable $throwable) {
        $result[] = get_class($throwable);
        $result[] = $throwable->getMessage();
        $result[] = $throwable->getFile();
        $result[] = $throwable->getLine();
        $result[] = $throwable->getTraceAsString();
    }
}

myFunction();

return $result;
EOS
*/;}), //jshint ignore:line
            syncRuntime = tools.createSyncRuntime(),
            module = tools.transpile(syncRuntime, '/path/to/my_module.php', php),
            engine;

        syncRuntime.install(evalAddon);
        engine = module();

        expect(engine.execute().getNative()).to.deep.equal([
            // Error class name
            'ParseError',

            // Message
            'syntax error, unexpected \'@\'',

            // File
            '/path/to/my_module.php(9) : eval()\'d code',

            // Line number
            3,

            // Trace
            '#0 /path/to/my_module.php(19): myFunction()\n#1 {main}'
        ]);
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
