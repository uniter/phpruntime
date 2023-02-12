/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    asyncRuntime = require('phpcore/async'),
    phpCommon = require('phpcommon'),
    psyncRuntime = require('phpcore/psync'),
    syncRuntime = require('phpcore/sync'),
    Exception = phpCommon.Exception;

/**
 * Creates an Environment for the given mode.
 *
 * @param {string} mode
 * @param {Object=} options
 * @param {Array=} addons
 * @returns {Environment}
 */
function createEnvironment(mode, options, addons) {
    switch (mode) {
        case 'async':
            return asyncRuntime.createEnvironment(options, addons);
        case 'psync':
            return psyncRuntime.createEnvironment(options, addons);
        case 'sync':
        default:
            return syncRuntime.createEnvironment(options, addons);
    }
}

module.exports = {
    /**
     * Creates an isolated PHPState required for some unit testing.
     *
     * For example, ValueFactory's behaviour is difficult to stub,
     * so we use an isolated concrete instance along with its dependencies.
     *
     * @param {string=} mode Synchronicity mode: "async", "psync" or "sync"
     * @param {Object.<string, Object>=} serviceOverrides Overrides for services by ID
     * @param {Object=} options
     * @param {Array=} addons
     * @returns {PHPState}
     */
    createIsolatedState: function (mode, serviceOverrides, options, addons) {
        var environment;

        addons = addons || [];

        if (serviceOverrides) {
            // Service overrides have been provided. For example, a stub CallStack (id "call_stack")
            // may have been provided in order to stub error handling.

            // Install the service overrides via a mini addon.
            addons.push({
                serviceGroups: function (internals) {
                    var serviceProviders = {};

                    internals.allowServiceOverride();

                    _.forOwn(serviceOverrides, function (service, id) {
                        var provider;

                        if (/^!/.test(id)) {
                            id = id.replace(/^!/, '');

                            if (typeof service !== 'function') {
                                throw new Exception(
                                    'Override for service "' + id + '" must be a function'
                                );
                            }

                            provider = function () {
                                return service(internals);
                            };
                        } else {
                            provider = function () {
                                return service;
                            };
                        }

                        serviceProviders[id] = provider;
                    });

                    return serviceProviders;
                }
            });
        }

        environment = createEnvironment(mode, options, addons);

        return environment.getState();
    }
};
