/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = function (internals) {
    return {
        /**
         * Converts a dotted decimal IP address string to its packed representation.
         *
         * @see {@link https://secure.php.net/manual/en/function.inet-pton.php}
         *
         * @returns {Value}
         */
        'inet_pton': internals.typeFunction(
            // FIXME: Add return type when supported: "string|false".
            'string $ip',
            function (ipValue) {
                var ip = ipValue.getNative(),
                    parts = ip.split('.');

                return parts
                    .map(function (part) {
                        return String.fromCharCode(part);
                    })
                    .join('');
            }
        )
    };
};
