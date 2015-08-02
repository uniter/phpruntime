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
    phpRuntime = require('../..'),
    Runtime = require('../../src/Runtime');

describe('Public API', function () {
    it('should export an instance of Runtime', function () {
        expect(phpRuntime).to.be.an.instanceOf(Runtime);
    });
});
