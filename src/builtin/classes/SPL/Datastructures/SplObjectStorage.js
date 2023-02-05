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
    COUNT_NORMAL = 0,
    phpCommon = require('phpcommon'),
    Exception = phpCommon.Exception,
    Map = require('core-js-pure/actual/map');

module.exports = function (internals) {
    var callStack = internals.callStack,
        getObjectKey = function (objectValue) {
            return objectValue.getID();
        },
        valueFactory = internals.valueFactory;

    /**
     * Stores data keyed by object rather than scalar, in contrast to arrays.
     *
     * @see {@link https://secure.php.net/manual/en/class.splobjectstorage.php}
     * @constructor
     */
    function SplObjectStorage() {
        this.setInternalProperty('objects', new Map());
    }

    internals.implement('Countable');
    internals.implement('Iterator');
    internals.implement('Serializable');
    internals.implement('ArrayAccess');

    _.extend(SplObjectStorage.prototype, {
        /**
         * Adds all objects from another storage to this one.
         *
         * @see {@link https://secure.php.net/manual/en/splobjectstorage.addall.php}
         *
         * @param {ObjectValue} storageValue
         * @returns {IntegerValue}
         */
        'addAll': internals.typeInstanceMethod('SplObjectStorage $storage: int', function () {
            throw new Exception('SplObjectStorage.addAll() :: Not yet implemented');
        }),

        /**
         * Adds an object to this storage.
         *
         * @see {@link https://secure.php.net/manual/en/splobjectstorage.attach.php}
         *
         * @param {ObjectValue} objectValue
         * @param {Value} infoValue
         */
        'attach': internals.typeInstanceMethod(
            'object $object, mixed $info = null',
            function (objectValue, infoValue) {
                var storageValue = this,
                    objectMap = storageValue.getInternalProperty('objects'),
                    key = getObjectKey(objectValue);

                objectMap.set(key, infoValue);
            }
        ),

        /**
         * Fetches the number of objects in the storage.
         *
         * @see {@link https://secure.php.net/manual/en/splobjectstorage.count.php}
         */
        'count': internals.typeInstanceMethod(
            'int $mode = COUNT_NORMAL : int',
            function (modeValue) {
                var mode = modeValue.getNative();

                if (mode !== COUNT_NORMAL) {
                    throw new Error('Unsupported mode for SplObjectStorage->count(...) :: ' + mode);
                }

                return valueFactory.createInteger(
                    this.getInternalProperty('objects').size
                );
            }
        ),

        /**
         * Determines whether an object exists in the storage.
         *
         * @see {@link https://secure.php.net/manual/en/splobjectstorage.offsetexists.php}
         *
         * @param {ObjectValue} objectValue
         * @returns {BooleanValue}
         */
        'offsetExists': internals.typeInstanceMethod(
            'object $object: bool',
            function (objectValue) {
                var objectMap = this.getInternalProperty('objects'),
                    key = getObjectKey(objectValue);

                return valueFactory.createBoolean(objectMap.has(key));
            }
        ),

        /**
         * Fetches data for an object in the storage.
         *
         * @see {@link https://secure.php.net/manual/en/splobjectstorage.offsetget.php}
         *
         * @param {ObjectValue} objectValue
         * @returns {Value}
         */
        'offsetGet': internals.typeInstanceMethod(
            'object $object : mixed',
            function (objectValue) {
                var storageValue = this,
                    objectMap = storageValue.getInternalProperty('objects'),
                    key = getObjectKey(objectValue);

                if (!objectMap.has(key)) {
                    callStack.raiseTranslatedError();
                }

                return objectMap.get(key);
            }
        )
    });

    internals.disableAutoCoercion();

    return SplObjectStorage;
};
