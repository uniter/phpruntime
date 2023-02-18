/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpCommon = require('phpcommon'),
    Exception = phpCommon.Exception;

module.exports = function (internals) {
    var valueFactory = internals.valueFactory;

    return {
        /**
         * Parses the components of a URL into an array.
         *
         * @see {@link https://secure.php.net/manual/en/function.parse-url.php}
         *
         * @returns {Value}
         */
        'parse_url': internals.typeFunction(
            'string $url, int $component = -1',
            function (urlValue, componentValue) {
                var component = componentValue.getNative(),
                    match,
                    url = urlValue.getNative(),
                    components = [];

                if (component !== -1) {
                    throw new Exception('parse_url() :: $component <> -1 not yet supported');
                }

                match = url.match(/^(?:(\w+):\/\/)?(?:([^:@]*)(?::([^@]*))?@)?([^:/?#]*)(?::(\d+))?(\/[^#?]*)?(?:\?([^#]+))?(?:#(.*))?$/);

                if (match === null) {
                    // Seriously malformed URL - return false.
                    return false;
                }

                if (match[1] !== undefined) {
                    components.scheme = match[1];
                }

                if (match[2] !== undefined) {
                    components.user = match[2];
                }

                if (match[3] !== undefined) {
                    components.pass = match[3];
                }

                if (match[4] !== '') {
                    components.host = match[4];
                }

                if (match[5] !== undefined) {
                    components.port = Number(match[5]);
                }

                if (match[6] !== undefined) {
                    components.path = match[6];
                }

                if (match[7] !== undefined) {
                    components.query = match[7];
                }

                if (match[8] !== undefined) {
                    components.fragment = match[8];
                }

                return valueFactory.createFromNativeArray(components);
            }
        )
    };
};
