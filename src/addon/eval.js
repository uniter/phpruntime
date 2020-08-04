/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var evalOptionGroup = require('../builtin/options/eval');

/**
 * PHP eval(...) support using PHPToAST and PHPToJS
 */
module.exports = {
    optionGroups: [
        evalOptionGroup
    ]
};
