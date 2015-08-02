/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash');

function Call(scope) {
    this.scope = scope;
}

_.extend(Call.prototype, {
    getScope: function () {
        return this.scope;
    }
});

module.exports = Call;
