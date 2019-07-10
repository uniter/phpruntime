/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var systemConstants = require('../../../../constants');

module.exports = function (internals) {
    var valueFactory = internals.valueFactory;

    return {
        /**
         * Returns information about the operating system PHP is running on
         *
         * @see {@link https://secure.php.net/manual/en/function.php-uname.php}
         *
         * @param {Variable|Value} modeReference
         * @returns {StringValue}
         */
        'php_uname': function (modeReference) {
            var mode = modeReference ? modeReference.getValue().getNative() : 'a',
                string;

            switch (mode) {
                case 's': // Operating system name. eg. FreeBSD
                    string = systemConstants.operatingSystem.name;
                    break;
                case 'n': // Host name. eg. localhost.example.com
                    string = systemConstants.operatingSystem.hostName;
                    break;
                case 'r': // Release name. eg. 5.1.2-RELEASE
                    string = systemConstants.operatingSystem.releaseName;
                    break;
                case 'v': // Version information. Varies a lot between operating systems
                    string = systemConstants.operatingSystem.versionInfo;
                    break;
                case 'm': // Machine type. eg. i386
                    string = systemConstants.operatingSystem.machineType;
                    break;
                default:
                case 'a': // All modes together (default)
                    string = systemConstants.operatingSystem.name + ' ' +
                        systemConstants.operatingSystem.hostName + ' ' +
                        systemConstants.operatingSystem.releaseName + ' ' +
                        systemConstants.operatingSystem.versionInfo + ' ' +
                        systemConstants.operatingSystem.machineType;
            }

            return valueFactory.createString(string);
        },

        /**
         * Returns the PHP version that this version of Uniter is targeting
         *
         * @see {@link https://secure.php.net/manual/en/function.phpversion.php}
         *
         * @returns {BooleanValue|StringValue}
         */
        'phpversion': function (extensionName) {
            if (extensionName) {
                // No extensions are supported (yet)
                return valueFactory.createBoolean(false);
            }

            // Default behaviour is just to return the PHP version string
            return valueFactory.createString(
                systemConstants.phpVersion.major + '.' +
                systemConstants.phpVersion.minor + '.' +
                systemConstants.phpVersion.release
            );
        },

        /**
         * Returns the version of the current Zend engine (different to the PHP version)
         *
         * Uniter is not related to Zend's engine at all, so this function makes little sense here.
         * It is required by some scripts though (eg. Zend's test runner `run-tests.php` script),
         * so it is added for completeness. HHVM also defines this function for compatibility.
         *
         * @see {@link https://secure.php.net/manual/en/function.zend-version.php}
         *
         * @returns {StringValue}
         */
        'zend_version': function () {
            return valueFactory.createString(
                systemConstants.zendVersion.major + '.' +
                systemConstants.zendVersion.minor + '.' +
                systemConstants.zendVersion.release
            );
        }
    };
};
