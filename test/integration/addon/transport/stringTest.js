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
    phpCommon = require('phpcommon'),
    tools = require('../../tools'),
    stringTransportAddon = require('../../../../src/addon/transport/string'),
    Exception = phpCommon.Exception;

describe('PHP string transport integration', function () {
    var syncRuntime;

    beforeEach(function () {
        syncRuntime = tools.createSyncRuntime();
    });

    it('should allow include transports to return a PHP code string', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result[] = require __DIR__ . '/my_first_include.php';
$result[] = require __DIR__ . '/my_second_include.php';

return $result;
EOS
*/;}), //jshint ignore:line
            environment = syncRuntime.createEnvironment({
                include: function (path, promise) {
                    promise.resolve('<?php return "my path is: " . ' + JSON.stringify(path) + ';');
                }
            }, [
                stringTransportAddon
            ]),
            module = tools.transpile(syncRuntime, '/my/path/to/my_script.php', php),
            engine = module({}, environment);

        expect(engine.execute().getNative()).to.deep.equal([
            'my path is: /my/path/to/my_first_include.php',
            'my path is: /my/path/to/my_second_include.php'
        ]);
        expect(engine.getStderr().readAll()).to.equal('');
    });

    it('should correctly raise an error when an include is performed with no chained transport configured', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

require __DIR__ . '/my_include.php';
EOS
*/;}), //jshint ignore:line
            environment = syncRuntime.createEnvironment({}, [
                stringTransportAddon
            ]),
            module = tools.transpile(syncRuntime, '/my/path/to/my_script.php', php),
            engine = module({}, environment);

        expect(function () {
            engine.execute();
        }).to.throw(
            Exception,
            'PHP Fatal error: require(): Failed opening \'/my/path/to/my_include.php\' for inclusion in /my/path/to/my_script.php on line 3'
        );
        expect(engine.getStderr().readAll()).to.equal(
            nowdoc(function () {/*<<<EOS
PHP Warning:  require(/my/path/to/my_include.php): failed to open stream: load(/my/path/to/my_include.php) :: No "include" transport option is available for loading the module in /my/path/to/my_script.php on line 3
PHP Fatal error:  require(): Failed opening '/my/path/to/my_include.php' for inclusion in /my/path/to/my_script.php on line 3

EOS
*/;}) //jshint ignore:line
        );
    });

    it('should correctly raise a ParseError when invalid syntax is returned by the chained transport', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

function myFunction() {
    global $result;

    try {
        require __DIR__ . '/the/invalid_included_script.php';
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
            environment = syncRuntime.createEnvironment({
                include: function (path, promise) {
                    // Note the deliberate invalid PHP syntax here
                    promise.resolve('<?php \n\nmy invalid syntax here!');
                }
            }, [
                stringTransportAddon
            ]),
            module = tools.transpile(syncRuntime, '/my/path/to/my_script.php', php),
            engine = module({}, environment);

        expect(engine.execute().getNative()).to.deep.equal([
            // Error class name
            'ParseError',

            // Message
            'syntax error, unexpected \'i\'',

            // File
            '/my/path/to/the/invalid_included_script.php',

            // Line number
            3,

            // Trace
            '#0 /my/path/to/my_script.php(19): myFunction()\n#1 {main}'
        ]);
        expect(engine.getStderr().readAll()).to.equal('');
    });
});
