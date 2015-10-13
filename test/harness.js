/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);
