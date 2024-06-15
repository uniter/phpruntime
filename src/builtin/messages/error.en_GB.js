/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

/*
 * Translations for error-level error messages.
 */
module.exports = {
    'en_GB': {
        'core': {
            'arguments_missing': '${required} arguments are required, ${given} given',
            'cannot_pop_from_empty_datastructure': 'Can\'t pop from an empty datastructure',
            'cannot_shift_from_empty_datastructure': 'Can\'t shift from an empty datastructure',
            'cannot_start_already_started_fiber': 'Cannot start a fiber that has already been started',
            'cannot_suspend_outside_fiber': 'Cannot suspend outside of a fiber',
            'fiber_not_yet_returned': 'Cannot get fiber return value: The fiber has not returned',
            'fiber_not_started': 'Cannot get fiber return value: The fiber has not been started',
            'fiber_not_suspended': 'Cannot resume a fiber that is not suspended',
            'fiber_threw_exception': 'Cannot get fiber return value: The fiber threw an exception',
            'get_class_without_args_outside_class': 'get_class() without arguments must be called from within a class',
            'offset_out_of_range': 'Offset invalid or out of range'
        }
    }
};
