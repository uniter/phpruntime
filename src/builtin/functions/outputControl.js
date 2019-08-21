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
    Exception = phpCommon.Exception,
    NoActiveOutputBufferException = require('phpcore/src/Exception/NoActiveOutputBufferException'),
    PHPError = phpCommon.PHPError;

/**
 * Output control functions
 *
 * @param {object} internals
 * @return {object}
 */
module.exports = function (internals) {
    var callStack = internals.callStack,
        output = internals.output,
        valueFactory = internals.valueFactory;

    return {
        /**
         * Erases the current output buffer without turning it off
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-clean.php}
         *
         * @returns {BooleanValue} Returns true on success or false on failure
         */
        'ob_clean': function () {
            try {
                output.cleanCurrentBuffer();
            } catch (error) {
                if (!(error instanceof NoActiveOutputBufferException)) {
                    throw error;
                }

                callStack.raiseError(
                    PHPError.E_NOTICE,
                    'ob_clean(): failed to delete buffer. No buffer to delete'
                );

                return valueFactory.createBoolean(false);
            }

            return valueFactory.createBoolean(true);
        },

        /**
         * Erases the output buffer and then turns it off, essentially discarding the current buffer
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-end-clean.php}
         * @TODO: Output E_NOTICE on failure
         *
         * @returns {BooleanValue} Returns true on success or false on failure
         */
        'ob_end_clean': function () {
            try {
                output.popBuffer();
            } catch (error) {
                callStack.raiseError(
                    PHPError.E_NOTICE,
                    'ob_end_clean(): failed to delete buffer. No buffer to delete'
                );

                return valueFactory.createBoolean(false);
            }

            return valueFactory.createBoolean(true);
        },

        /**
         * Sends the output buffer to the next buffer in the chain, then turns off the output buffer.
         * If the next one in the chain is the default StdoutBuffer, then the buffer contents
         * will be written to stdout
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-end-flush.php}
         *
         * @returns {BooleanValue} Returns true on success or false on failure
         */
        'ob_end_flush': function () {
            try {
                output.flushCurrentBuffer();
                output.popBuffer();
            } catch (error) {
                if (!(error instanceof NoActiveOutputBufferException)) {
                    throw error;
                }

                callStack.raiseError(
                    PHPError.E_NOTICE,
                    'ob_end_flush(): failed to delete and flush buffer. No buffer to delete or flush'
                );

                return valueFactory.createBoolean(false);
            }

            return valueFactory.createBoolean(true);
        },

        /**
         * Sends the output buffer to the next buffer in the chain.
         * If the next one in the chain is the default StdoutBuffer, then the buffer contents
         * will be written to stdout
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-flush.php}
         *
         * @returns {BooleanValue} Returns true on success or false on failure
         */
        'ob_flush': function () {
            try {
                output.flushCurrentBuffer();
            } catch (error) {
                callStack.raiseError(
                    PHPError.E_NOTICE,
                    'ob_flush(): failed to flush buffer. No buffer to flush'
                );

                return valueFactory.createBoolean(false);
            }

            return valueFactory.createBoolean(true);
        },

        /**
         * Fetches the contents of the output buffer and deletes the current buffer
         * (essentially executing `ob_get_contents()` and then `ob_end_clean()`)
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-get-clean.php}
         *
         * @returns {StringValue|BooleanValue} Returns the output buffer or FALSE if no buffer is active
         */
        'ob_get_clean': function () {
            var contents;

            if (output.getDepth() === 0) {
                // No buffer is active (except the default StdoutBuffer, which does not count for this)
                return valueFactory.createBoolean(false);
            }

            contents = output.getCurrentBufferContents();
            output.popBuffer();

            return valueFactory.createString(contents);
        },

        /**
         * Fetches the contents of the output buffer without clearing it
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-get-contents.php}
         *
         * @returns {StringValue|BooleanValue} Returns the output buffer or FALSE if no buffer is active
         */
        'ob_get_contents': function () {
            var contents;

            if (output.getDepth() === 0) {
                // No buffer is active (except the default StdoutBuffer, which does not count for this)
                return valueFactory.createBoolean(false);
            }

            contents = output.getCurrentBufferContents();

            return valueFactory.createString(contents);
        },

        /**
         * Flushes the output buffer, returns it as a string and turns off output buffering
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-get-flush.php}
         *
         * @returns {StringValue|BooleanValue} Returns the output buffer or FALSE if no buffer is active
         */
        'ob_get_flush': function () {
            var contents;

            if (output.getDepth() === 0) {
                callStack.raiseError(
                    PHPError.E_NOTICE,
                    'ob_get_flush(): failed to delete and flush buffer. No buffer to delete or flush'
                );

                // No buffer is active (except the default StdoutBuffer, which does not count for this)
                return valueFactory.createBoolean(false);
            }

            contents = output.getCurrentBufferContents();
            output.flushCurrentBuffer();

            return valueFactory.createString(contents);
        },

        /**
         * Fetches the nesting level of the output buffering mechanism
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-get-level.php}
         *
         * @returns {IntegerValue} Returns the nesting level of the output buffering mechanism
         */
        'ob_get_level': function () {
            return valueFactory.createInteger(output.getDepth());
        },

        /**
         * Turns on output buffering, or adds a new buffer to the stack if it is already on
         *
         * @see {@link https://secure.php.net/manual/en/function.ob-start.php}
         *
         * @param {Variable|Value} outputCallbackReference
         */
        'ob_start': function (outputCallbackReference, chunkSizeReference, flagsReference) {
            if (outputCallbackReference || chunkSizeReference || flagsReference) {
                throw new Exception('ob_start() :: No arguments are supported yet');
            }

            output.pushBuffer();
        }
    };
};
