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

describe('PHP "phpversion" builtin function integration', function () {
    it('should return the correct string when no extension is specified', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return phpversion();
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.equal('5.4.0');
    });

    it('should return false for now when any extension is specified', function () {
        var php = nowdoc(function () {/*<<<EOS
<?php

return phpversion('any_ext');
EOS
*/;}), //jshint ignore:line
            module = tools.syncTranspile(null, php),
            engine = module();

        expect(engine.execute().getNative()).to.be.false;
    });
});
