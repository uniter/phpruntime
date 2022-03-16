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
    phpCommon = require('phpcommon'),
    Exception = phpCommon.Exception;

module.exports = function (internals) {
    /**
     * Stores a queue of items (where items are added to the end and fetched from the beginning).
     * This is in contrast to a stack, where items are both added and fetched from the end.
     *
     * @see {@link https://secure.php.net/manual/en/class.splqueue.php}
     * @constructor
     */
    function SplQueue() {
        internals.callSuperConstructor(this, arguments);
    }

    internals.extendClass('SplDoublyLinkedList');

    _.extend(SplQueue.prototype, {
        /**
         * Fetches and then removes an item from the top of the queue.
         *
         * @see {@link https://secure.php.net/manual/en/splqueue.dequeue.php}
         *
         * @returns {Value}
         */
        'dequeue': internals.typeInstanceMethod(': mixed', function () {
            // SplQueue->dequeue(...) is identical in behaviour to SplDoublyLinkedList->shift(...).
            return this.callMethod('shift');
        }),

        /**
         * Adds an item to the bottom of the queue.
         *
         * @see {@link https://secure.php.net/manual/en/splqueue.enqueue.php}
         *
         * @returns {NullValue}
         */
        'enqueue': internals.typeInstanceMethod('mixed $value', function (itemValue) {
            // TODO: Add void return type above once supported.

            // SplQueue->enqueue(...) is identical in behaviour to SplDoublyLinkedList->push(...).
            return this.callMethod('push', [itemValue]);
        }),

        /**
         * Sets the mode of iteration used for this queue.
         *
         * @see {@link https://secure.php.net/manual/en/splqueue.setiteratormode.php}
         *
         * @returns {NullValue}
         */
        'setIteratorMode': internals.typeInstanceMethod('int $mode', function () {
            throw new Exception('SplQueue.setIteratorMode() :: Not yet implemented');
        })
    });

    internals.disableAutoCoercion();

    return SplQueue;
};
