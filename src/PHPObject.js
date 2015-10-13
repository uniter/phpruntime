/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    Promise = require('bluebird');

function PHPObject(pausable, valueFactory, objectValue) {
    this.objectValue = objectValue;
    this.pausable = pausable;
    this.valueFactory = valueFactory;
}

_.extend(PHPObject.prototype, {
    /**
     * Calls the specified method of the wrapped ObjectValue, returning a Promise.
     * Allows JS-land code to call objects exported/returned from PHP-land,
     * where asynchronous (blocking) operation is possible.
     *
     * @param {string} name
     * @returns {Promise}
     */
    callMethod: function (name) {
        var phpObject = this,
            args = [].slice.call(arguments, 1);

        // Arguments will be from JS-land, so coerce any to wrapped PHP value objects
        args = _.map(args, function (arg) {
            return phpObject.valueFactory.coerce(arg);
        });

        if (phpObject.pausable) {
            return new Promise(function (resolve, reject) {
                // Call the method via Pausable to allow for blocking operation
                phpObject.pausable.call(
                    phpObject.objectValue.callMethod,
                    [name, args],
                    phpObject.objectValue
                )
                    .done(resolve)
                    .fail(reject);
            });
        }

        // Pausable is unavailable (non-blocking mode),
        // but still return a Promise for consistency
        return Promise.resolve(phpObject.objectValue.callMethod(name, args));
    }
});

module.exports = PHPObject;
