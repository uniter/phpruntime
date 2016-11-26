/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = {
    sapi: 'cli',

    operatingSystem: {
        name: 'Uniter',           // Operating system name. eg. FreeBSD
        hostName: 'localhost',    // Host name. eg. localhost.example.com
        releaseName: '1.0.0',     // Release name. eg. 5.1.2-RELEASE
        versionInfo: '(Generic)', // Version information. Varies a lot between operating systems
        machineType: 'JavaScript' // Machine type. eg. i386
    },

    phpVersion: {
        major: 5,
        minor: 4,
        release: 0
    },

    zendVersion: {
        major: 2,
        minor: 5,
        release: 0
    }
};
