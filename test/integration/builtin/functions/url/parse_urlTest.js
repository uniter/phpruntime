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

describe('PHP "parse_url" builtin function integration', function () {
    it('should be able to parse URLs', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['all components'] = parse_url('https://myuser:mypass@mysite.com:1234/my/file_path.ext?arg1=one&arg2=two#anchor7');

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal({
            'all components': {
                'scheme': 'https',
                'user': 'myuser',
                'pass': 'mypass',
                'host': 'mysite.com',
                'port': 1234,
                'path': '/my/file_path.ext',
                'query': 'arg1=one&arg2=two',
                'fragment': 'anchor7'
            }
        });
    });
});
