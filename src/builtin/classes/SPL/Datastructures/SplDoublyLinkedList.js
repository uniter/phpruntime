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
    CANNOT_POP_FROM_EMPTY_DATASTRUCTURE = 'core.cannot_pop_from_empty_datastructure',
    CANNOT_SHIFT_FROM_EMPTY_DATASTRUCTURE = 'core.cannot_shift_from_empty_datastructure',
    OFFSET_OUT_OF_RANGE = 'core.offset_out_of_range',
    PHPError = phpCommon.PHPError;

module.exports = function (internals) {
    var callStack = internals.callStack,
        valueFactory = internals.valueFactory;

    /**
     * Stores a list of items.
     *
     * @see {@link https://secure.php.net/manual/en/class.spldoublylinkedlist.php}
     * @constructor
     */
    function SplDoublyLinkedList() {
        this.setInternalProperty('items', []);
    }

    internals.implement('Iterator');
    internals.implement('Countable');
    internals.implement('ArrayAccess');
    internals.implement('Serializable');

    internals.defineConstant('IT_MODE_LIFO', 2);
    internals.defineConstant('IT_MODE_FIFO', 0);
    internals.defineConstant('IT_MODE_DELETE', 1);
    internals.defineConstant('IT_MODE_KEEP', 0);

    _.extend(SplDoublyLinkedList.prototype, {
        /**
         * Fetches the number of items in the list.
         *
         * @see {@link https://secure.php.net/manual/en/spldoublylinkedlist.count.php}
         *
         * @returns {IntegerValue}
         */
        'count': internals.typeInstanceMethod(
            ': int',
            function () {
                var items = this.getInternalProperty('items');

                return valueFactory.createInteger(items.length);
            }
        ),

        /**
         * Determines whether the list is empty.
         *
         * @see {@link https://secure.php.net/manual/en/spldoublylinkedlist.isempty.php}
         *
         * @returns {BooleanValue}
         */
        'isEmpty': internals.typeInstanceMethod(
            ': bool',
            function () {
                var items = this.getInternalProperty('items');

                return valueFactory.createBoolean(items.length === 0);
            }
        ),

        /**
         * Determines whether an index exists in the list.
         *
         * @see {@link https://secure.php.net/manual/en/spldoublylinkedlist.offsetexists.php}
         *
         * @param {IntegerValue} indexValue
         * @returns {BooleanValue}
         */
        'offsetExists': internals.typeInstanceMethod(
            'int $index: bool',
            function (indexValue) {
                var items = this.getInternalProperty('items'),
                    index = indexValue.getNative();

                return valueFactory.createBoolean(Boolean(items[index]));
            }
        ),

        /**
         * Fetches an item in the list.
         *
         * @see {@link https://secure.php.net/manual/en/spldoublylinkedlist.offsetget.php}
         *
         * @param {IntegerValue} indexValue
         * @returns {Value}
         */
        'offsetGet': internals.typeInstanceMethod(
            'int $index: mixed',
            function (indexValue) {
                var items = this.getInternalProperty('items'),
                    index = indexValue.getNative();

                if (!items[index]) {
                    callStack.raiseTranslatedError(
                        PHPError.E_ERROR,
                        OFFSET_OUT_OF_RANGE,
                        {},
                        'OutOfRangeException'
                    );
                }

                return items[index];
            }
        ),

        /**
         * Pops an item from the end of the list.
         *
         * @see {@link https://secure.php.net/manual/en/spldoublylinkedlist.pop.php}
         *
         * @returns {Value}
         */
        'pop': internals.typeInstanceMethod(': mixed', function () {
            var items = this.getInternalProperty('items');

            if (items.length === 0) {
                callStack.raiseTranslatedError(PHPError.E_ERROR, CANNOT_POP_FROM_EMPTY_DATASTRUCTURE);
            }

            return items.pop();
        }),

        /**
         * Pushes an item onto the end of the list.
         *
         * @see {@link https://secure.php.net/manual/en/spldoublylinkedlist.push.php}
         *
         * @returns {Value}
         */
        'push': internals.typeInstanceMethod('mixed $value', function (itemValue) {
            // TODO: Add void return type above once supported.
            var items = this.getInternalProperty('items');

            items.push(itemValue);
        }),

        /**
         * Fetches and then removes an item from the beginning of the list.
         *
         * @see {@link https://secure.php.net/manual/en/spldoublylinkedlist.shift.php}
         *
         * @returns {Value}
         */
        'shift': internals.typeInstanceMethod(': mixed', function () {
            var items = this.getInternalProperty('items');

            if (items.length === 0) {
                callStack.raiseTranslatedError(PHPError.E_ERROR, CANNOT_SHIFT_FROM_EMPTY_DATASTRUCTURE);
            }

            return items.shift();
        })
    });

    internals.disableAutoCoercion();

    return SplDoublyLinkedList;
};
