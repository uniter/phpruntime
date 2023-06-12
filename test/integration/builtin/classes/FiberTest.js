/*
 * PHPRuntime - PHP environment runtime components
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpruntime/
 *
 * Released under the MIT license
 * https://github.com/uniter/phpruntime/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    tools = require('../../tools');

describe('PHP "Fiber" builtin class integration', function () {
    describe('::getCurrent()', function () {
        it('should return null when there is no current fiber', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result['is null'] = Fiber::getCurrent() === null;

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal({
                'is null': true
            });
        });

        it('should return the current Fiber when one is executing', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first, ::getCurrent() is null: ' . var_export(Fiber::getCurrent() === null, true);
$fiber = new Fiber(function () use (&$fiber, &$result) {
    $result[] = 'second, ::getCurrent() returns this Fiber: ' . var_export(Fiber::getCurrent() === $fiber, true);
});
$result[] = 'third, ::getCurrent() is null: ' . var_export(Fiber::getCurrent() === null, true);
$fiber->start();
$result[] = 'fourth, ::getCurrent() is null: ' . var_export(Fiber::getCurrent() === null, true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first, ::getCurrent() is null: true',
                'third, ::getCurrent() is null: true',
                'second, ::getCurrent() returns this Fiber: true',
                'fourth, ::getCurrent() is null: true'
            ]);
        });
    });

    describe('->getReturn()', function () {
        it('should return the result when the fiber returns a value', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result) : string {
    $result[] = 'second';

    return 'my result';

    $result[] = 'third';
});

$result[] = 'fourth';
$fiber->start();
$result[] = 'fifth, from fiber: ' . $fiber->getReturn();
$result[] = 'sixth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'second',
                'fifth, from fiber: my result',
                'sixth'
            ]);
        });

        it('should throw a FiberError when the fiber has not yet started', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';
});

$result[] = 'third';
try {
    $result[] = 'fourth';
    $value = $fiber->getReturn(); // Attempt (invalidly) to get the return value.
    $result[] = 'fifth';
} catch (Throwable $throwable) {
    $result[] = 'sixth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'seventh';
}
$result[] = 'eighth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'third',
                'fourth',
                'sixth, caught: FiberError "Cannot get fiber return value: The fiber has not been started"',
                'seventh',
                'eighth'
            ]);
        });

        it('should throw a FiberError when the fiber is currently running', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';

    $fiber->getReturn(); // Attempt (invalidly) to get the return value.

    $result[] = 'third';
});

$result[] = 'fourth';
try {
    $result[] = 'fifth';
    $value = $fiber->start();
    $result[] = 'sixth';
} catch (Throwable $throwable) {
    $result[] = 'seventh, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'eighth';
}
$result[] = 'ninth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'fifth',
                'second',
                'seventh, caught: FiberError "Cannot get fiber return value: The fiber has not returned"',
                'eighth',
                'ninth'
            ]);
        });

        it('should throw a FiberError when the fiber threw a Throwable', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';

    throw new Exception('Bang!');

    $result[] = 'third';
});

$result[] = 'fourth';
try {
    $result[] = 'fifth';
    $fiber->start();
    $result[] = 'sixth';
} catch (Throwable $throwable) {
    $result[] = 'seventh, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'eighth';
}
$result[] = 'ninth';

try {
    $result[] = 'tenth';
    $fiber->getReturn();
    $result[] = 'eleventh';
} catch (Throwable $throwable) {
    $result[] = 'twelfth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'thirteenth';
}
$result[] = 'fourteenth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'fifth',
                'second',
                'seventh, caught: Exception "Bang!"',
                'eighth',
                'ninth',
                'tenth',
                'twelfth, caught: FiberError "Cannot get fiber return value: The fiber threw an exception"',
                'thirteenth',
                'fourteenth'
            ]);
        });
    });

    describe('->isRunning()', function () {
        it('should return true only while the fiber is running, when returning', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result) {
    $result[] = 'second, ->isRunning() before suspending: ' . var_export($fiber->isRunning(), true);

    Fiber::suspend('from fiber');

    $result[] = 'third, ->isRunning() after resuming: ' . var_export($fiber->isRunning(), true);
});

$result[] = 'fourth, ->isRunning() before starting: ' . var_export($fiber->isRunning(), true);
$fiber->start();
$result[] = 'fifth, ->isRunning() after starting when suspended: ' . var_export($fiber->isRunning(), true);
$fiber->resume();
$result[] = 'fifth, ->isRunning() after returning: ' . var_export($fiber->isRunning(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth, ->isRunning() before starting: false',
                'second, ->isRunning() before suspending: true',
                'fifth, ->isRunning() after starting when suspended: false',
                'third, ->isRunning() after resuming: true',
                'fifth, ->isRunning() after returning: false'
            ]);
        });

        it('should return true only while the fiber is running, when throwing', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result) {
    $result[] = 'second, ->isRunning() before suspending: ' . var_export($fiber->isRunning(), true);

    try {
        Fiber::suspend('from fiber');
        $result[] = 'third';
    } catch (Throwable $throwable) {
        $result[] = 'fourth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
    }

    $result[] = 'fifth, ->isRunning() after resuming: ' . var_export($fiber->isRunning(), true);
});

$result[] = 'sixth, ->isRunning() before starting: ' . var_export($fiber->isRunning(), true);
$fiber->start();
$result[] = 'seventh, ->isRunning() after starting when suspended: ' . var_export($fiber->isRunning(), true);
$fiber->throw(new Exception('Bang!'));
$result[] = 'eighth, ->isRunning() after throwing: ' . var_export($fiber->isRunning(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'sixth, ->isRunning() before starting: false',
                'second, ->isRunning() before suspending: true',
                'seventh, ->isRunning() after starting when suspended: false',
                'fourth, caught: Exception "Bang!"',
                'fifth, ->isRunning() after resuming: true',
                'eighth, ->isRunning() after throwing: false'
            ]);
        });
    });

    describe('->isStarted()', function () {
        it('should return true only after the fiber has started', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result) {
    $result[] = 'second';

    Fiber::suspend('from fiber');

    $result[] = 'third';
});

$result[] = 'fourth, ->isStarted() before starting: ' . var_export($fiber->isStarted(), true);
$fiber->start();
$result[] = 'fifth, ->isStarted() after starting when suspended: ' . var_export($fiber->isStarted(), true);
$fiber->resume();
$result[] = 'fifth, ->isStarted() after returning: ' . var_export($fiber->isStarted(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth, ->isStarted() before starting: false',
                'second',
                'fifth, ->isStarted() after starting when suspended: true',
                'third',
                'fifth, ->isStarted() after returning: true'
            ]);
        });

        it('should return true even after the fiber has thrown', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result) {
    $result[] = 'second';

    try {
        Fiber::suspend('from fiber');
        $result[] = 'third';
    } catch (Throwable $throwable) {
        $result[] = 'fourth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
    }

    $result[] = 'fifth';
});

$result[] = 'sixth, ->isStarted() before starting: ' . var_export($fiber->isStarted(), true);
$fiber->start();
$result[] = 'seventh, ->isStarted() after starting when suspended: ' . var_export($fiber->isStarted(), true);
$fiber->throw(new Exception('Bang!'));
$result[] = 'eighth, ->isStarted() after throwing: ' . var_export($fiber->isStarted(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'sixth, ->isStarted() before starting: false',
                'second',
                'seventh, ->isStarted() after starting when suspended: true',
                'fourth, caught: Exception "Bang!"',
                'fifth',
                'eighth, ->isStarted() after throwing: true'
            ]);
        });
    });

    describe('->isSuspended()', function () {
        it('should return true only while the fiber is suspended, when returning', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result) {
    $result[] = 'second, ->isSuspended() before suspending: ' . var_export($fiber->isSuspended(), true);

    Fiber::suspend('from fiber');

    $result[] = 'third, ->isSuspended() after resuming: ' . var_export($fiber->isSuspended(), true);
});

$result[] = 'fourth, ->isSuspended() before starting: ' . var_export($fiber->isSuspended(), true);
$fiber->start();
$result[] = 'fifth, ->isSuspended() after starting when suspended: ' . var_export($fiber->isSuspended(), true);
$fiber->resume();
$result[] = 'fifth, ->isSuspended() after returning: ' . var_export($fiber->isSuspended(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth, ->isSuspended() before starting: false',
                'second, ->isSuspended() before suspending: false',
                'fifth, ->isSuspended() after starting when suspended: true',
                'third, ->isSuspended() after resuming: false',
                'fifth, ->isSuspended() after returning: false'
            ]);
        });

        it('should return true only while the fiber is suspended, when throwing', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result) {
    $result[] = 'second, ->isSuspended() before suspending: ' . var_export($fiber->isSuspended(), true);

    try {
        Fiber::suspend('from fiber');
        $result[] = 'third';
    } catch (Throwable $throwable) {
        $result[] = 'fourth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
    }

    $result[] = 'fifth, ->isSuspended() after resuming: ' . var_export($fiber->isSuspended(), true);
});

$result[] = 'sixth, ->isSuspended() before starting: ' . var_export($fiber->isSuspended(), true);
$fiber->start();
$result[] = 'seventh, ->isSuspended() after starting when suspended: ' . var_export($fiber->isSuspended(), true);
$fiber->throw(new Exception('Bang!'));
$result[] = 'eighth, ->isSuspended() after throwing: ' . var_export($fiber->isSuspended(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'sixth, ->isSuspended() before starting: false',
                'second, ->isSuspended() before suspending: false',
                'seventh, ->isSuspended() after starting when suspended: true',
                'fourth, caught: Exception "Bang!"',
                'fifth, ->isSuspended() after resuming: false',
                'eighth, ->isSuspended() after throwing: false'
            ]);
        });
    });

    describe('->isTerminated()', function () {
        it('should return true only after the fiber has returned', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result) {
    $result[] = 'second';

    Fiber::suspend('from fiber');

    $result[] = 'third';
});

$result[] = 'fourth, ->isTerminated() before starting: ' . var_export($fiber->isTerminated(), true);
$fiber->start();
$result[] = 'fifth, ->isTerminated() after starting when suspended: ' . var_export($fiber->isTerminated(), true);
$fiber->resume();
$result[] = 'fifth, ->isTerminated() after returning: ' . var_export($fiber->isTerminated(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth, ->isTerminated() before starting: false',
                'second',
                'fifth, ->isTerminated() after starting when suspended: false',
                'third',
                'fifth, ->isTerminated() after returning: true'
            ]);
        });

        it('should return true only after the fiber has thrown', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result) {
    $result[] = 'second';

    try {
        Fiber::suspend('from fiber');
        $result[] = 'third';
    } catch (Throwable $throwable) {
        $result[] = 'fourth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
    }

    $result[] = 'fifth';
});

$result[] = 'sixth, ->isTerminated() before starting: ' . var_export($fiber->isTerminated(), true);
$fiber->start();
$result[] = 'seventh, ->isTerminated() after starting when suspended: ' . var_export($fiber->isTerminated(), true);
$fiber->throw(new Exception('Bang!'));
$result[] = 'eighth, ->isTerminated() after throwing: ' . var_export($fiber->isTerminated(), true);

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'sixth, ->isTerminated() before starting: false',
                'second',
                'seventh, ->isTerminated() after starting when suspended: false',
                'fourth, caught: Exception "Bang!"',
                'fifth',
                'eighth, ->isTerminated() after throwing: true'
            ]);
        });
    });

    describe('->resume()', function () {
        it('should be able to resolve multiple times into a nested call', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

function myFunc() {
    global $result;
    $result[] = 'first';

    $value = Fiber::suspend('from fiber');

    $result[] = 'second, resumed with: ' . $value;

    $value = Fiber::suspend('from fiber');

    $result[] = 'third, resumed with: ' . $value;

    return 'my result from myFunc';
}

$result[] = 'fourth';
$fiber = new Fiber(function () use (&$result): void {
    $result[] = 'fifth';

    $value = myFunc();

    $result[] = 'sixth, result from myFunc was: ' . $value;
});

$result[] = 'seventh';
$value = $fiber->start();
$result[] = 'eighth, fiber suspended with: ' . $value;

$fiber->resume('sent to fiber first');
$result[] = 'ninth';
$fiber->resume('sent to fiber second');

$result[] = 'tenth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'fourth',
                'seventh',
                'fifth',
                'first',
                'eighth, fiber suspended with: from fiber',
                'second, resumed with: sent to fiber first',
                'ninth',
                'third, resumed with: sent to fiber second',
                'sixth, result from myFunc was: my result from myFunc',
                'tenth'
            ]);
        });

        it('should throw a FiberError when the fiber has not yet started', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';
});

$result[] = 'third';
try {
    $result[] = 'fourth';
    $value = $fiber->resume(); // Attempt (invalidly) to resume the fiber.
    $result[] = 'fifth';
} catch (Throwable $throwable) {
    $result[] = 'sixth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'seventh';
}
$result[] = 'eighth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'third',
                'fourth',
                'sixth, caught: FiberError "Cannot resume a fiber that is not suspended"',
                'seventh',
                'eighth'
            ]);
        });

        it('should throw a FiberError when the fiber is already running', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';

    $fiber->resume(); // Attempt (invalidly) to resume the running fiber.

    $result[] = 'third';
});

$result[] = 'fourth';
try {
    $result[] = 'fifth';
    $value = $fiber->start();
    $result[] = 'sixth';
} catch (Throwable $throwable) {
    $result[] = 'seventh, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'eighth';
}
$result[] = 'ninth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'fifth',
                'second',
                'seventh, caught: FiberError "Cannot resume a fiber that is not suspended"',
                'eighth',
                'ninth'
            ]);
        });

        it('should throw a FiberError when the fiber threw a Throwable', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';

    throw new Exception('Bang!');

    $result[] = 'third';
});

$result[] = 'fourth';
try {
    $result[] = 'fifth';
    $fiber->start();
    $result[] = 'sixth';
} catch (Throwable $throwable) {
    $result[] = 'seventh, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'eighth';
}
$result[] = 'ninth';

try {
    $result[] = 'tenth';
    $fiber->resume(21);
    $result[] = 'eleventh';
} catch (Throwable $throwable) {
    $result[] = 'twelfth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'thirteenth';
}
$result[] = 'fourteenth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'fifth',
                'second',
                'seventh, caught: Exception "Bang!"',
                'eighth',
                'ninth',
                'tenth',
                'twelfth, caught: FiberError "Cannot resume a fiber that is not suspended"',
                'thirteenth',
                'fourteenth'
            ]);
        });
    });

    describe('->start()', function () {
        // As the return value will be made available via ->getReturn().
        it('should return null when the fiber returns a value', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result) {
    $result[] = 'second';

    return 'my result';

    $result[] = 'third';
});

$result[] = 'fourth';
$result[] = 'fifth, from fiber: ' . var_export($fiber->start(), true);
$result[] = 'sixth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'second',
                'fifth, from fiber: NULL',
                'sixth'
            ]);
        });

        it('should pass the given arguments through to the fiber callable', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function ($first, $second) use (&$result) {
    $result[] = 'second, called with: ' . $first . ' and ' . $second;
});

$result[] = 'third';
$fiber->start('hello', 'world');
$result[] = 'fourth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'third',
                'second, called with: hello and world',
                'fourth'
            ]);
        });

        it('should throw a FiberError when the fiber is already running', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';

    $fiber->start(); // Attempt (invalidly) to start again.

    $result[] = 'third';
});

$result[] = 'fourth';
try {
    $result[] = 'fifth';
    $value = $fiber->start();
    $result[] = 'sixth';
} catch (Throwable $throwable) {
    $result[] = 'seventh, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'eighth';
}
$result[] = 'ninth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'fifth',
                'second',
                'seventh, caught: FiberError "Cannot start a fiber that has already been started"',
                'eighth',
                'ninth'
            ]);
        });
    });

    describe('::suspend()', function () {
        it('should throw a FiberError when called outside of any fiber', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
try {
    $result[] = 'second';
    $value = Fiber::suspend();
    $result[] = 'third';
} catch (Throwable $throwable) {
    $result[] = 'fourth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
}
$result[] = 'fifth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'second',
                'fourth, caught: FiberError "Cannot suspend outside of a fiber"',
                'fifth'
            ]);
        });
    });

    describe('->throw()', function () {
        it('should be able to throw into a nested call', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

function myFunc() {
    global $result;
    $result[] = 'first';

    try {
        $result[] = 'second';
        $value = Fiber::suspend('from fiber');
        $result[] = 'third';
    } catch (Throwable $throwable) {
        $result[] = 'fourth, thrown with: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
    } finally {
        $result[] = 'fifth';
    }

    return 'my result from myFunc';
}

$result[] = 'sixth';
$fiber = new Fiber(function () use (&$result): void {
    $result[] = 'seventh';

    $value = myFunc();

    $result[] = 'eighth, result from myFunc was: ' . $value;
});

$result[] = 'ninth';
$value = $fiber->start();
$result[] = 'tenth, fiber suspended with: ' . $value;

$fiber->throw(new Exception('Bang!'));

$result[] = 'eleventh';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'sixth',
                'ninth',
                'seventh',
                'first',
                'second',
                'tenth, fiber suspended with: from fiber',
                'fourth, thrown with: Exception "Bang!"',
                'fifth',
                'eighth, result from myFunc was: my result from myFunc',
                'eleventh'
            ]);
        });

        it('should return the value passed to the next ::suspend() call', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result): void {
    $result[] = 'second';

    try {
        $result[] = 'third';
        Fiber::suspend('from fiber first');
        $result[] = 'fourth';
    } catch (Throwable $throwable) {
        $result[] = 'fifth, thrown with: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
    } finally {
        $result[] = 'sixth';
    }

    $value = Fiber::suspend('from fiber second');

    $result[] = 'seventh, result from second ::suspend() was: ' . $value;
});

$result[] = 'eighth';
$value = $fiber->start();
$result[] = 'ninth, fiber suspended with: ' . $value;

$value = $fiber->throw(new Exception('Bang!'));

$result[] = 'tenth, result from ->throw() was: ' . $value;

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'eighth',
                'second',
                'third',
                'ninth, fiber suspended with: from fiber first',
                'fifth, thrown with: Exception "Bang!"',
                'sixth',
                'tenth, result from ->throw() was: from fiber second'
            ]);
        });

        it('should throw a FiberError when the fiber has not yet started', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';
});

$result[] = 'third';
try {
    $result[] = 'fourth';
    $value = $fiber->throw(new Exception('Bang!')); // Attempt (invalidly) to throw into the fiber.
    $result[] = 'fifth';
} catch (Throwable $throwable) {
    $result[] = 'sixth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'seventh';
}
$result[] = 'eighth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'third',
                'fourth',
                'sixth, caught: FiberError "Cannot resume a fiber that is not suspended"',
                'seventh',
                'eighth'
            ]);
        });

        it('should throw a FiberError when the fiber is already running', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';

    $fiber->throw(new Exception('Bang!')); // Attempt (invalidly) to throw into the running fiber.

    $result[] = 'third';
});

$result[] = 'fourth';
try {
    $result[] = 'fifth';
    $value = $fiber->start();
    $result[] = 'sixth';
} catch (Throwable $throwable) {
    $result[] = 'seventh, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'eighth';
}
$result[] = 'ninth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'fifth',
                'second',
                'seventh, caught: FiberError "Cannot resume a fiber that is not suspended"',
                'eighth',
                'ninth'
            ]);
        });

        it('should throw a FiberError when the fiber already threw a Throwable', async function () {
            var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$fiber, &$result): void {
    $result[] = 'second';

    throw new Exception('Bang!');

    $result[] = 'third';
});

$result[] = 'fourth';
try {
    $result[] = 'fifth';
    $fiber->start();
    $result[] = 'sixth';
} catch (Throwable $throwable) {
    $result[] = 'seventh, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'eighth';
}
$result[] = 'ninth';

try {
    $result[] = 'tenth';
    $fiber->throw(new Exception('Another bang!'));
    $result[] = 'eleventh';
} catch (Throwable $throwable) {
    $result[] = 'twelfth, caught: ' . $throwable::class . ' "' . $throwable->getMessage() . '"';
} finally {
    $result[] = 'thirteenth';
}
$result[] = 'fourteenth';

return $result;
EOS
*/;}), //jshint ignore:line
                module = tools.asyncTranspile('/path/to/my_module.php', php),
                engine = module();

            expect((await engine.execute()).getNative()).to.deep.equal([
                'first',
                'fourth',
                'fifth',
                'second',
                'seventh, caught: Exception "Bang!"',
                'eighth',
                'ninth',
                'tenth',
                'twelfth, caught: FiberError "Cannot resume a fiber that is not suspended"',
                'thirteenth',
                'fourteenth'
            ]);
        });
    });

    it('should allow a fiber to be suspended and later resumed from its entry callback', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber = new Fiber(function () use (&$result): void {
    $result[] = 'second';

    $value = Fiber::suspend('from fiber');

    $result[] = 'third, resumed with: ' . $value;
});

$result[] = 'fourth';
$value = $fiber->start();
$result[] = 'fifth, fiber suspended with: ' . $value;

$fiber->resume('sent to fiber');

$result[] = 'sixth';

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'first',
            'fourth',
            'second',
            'fifth, fiber suspended with: from fiber',
            'third, resumed with: sent to fiber',
            'sixth'
        ]);
    });

    it('should allow a fiber to be suspended and later resumed from a nested call', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

function myFunc() {
    global $result;
    $result[] = 'first';

    $value = Fiber::suspend('from fiber');

    $result[] = 'second, resumed with: ' . $value;

    return 'my result from myFunc';
}

$result[] = 'third';
$fiber = new Fiber(function () use (&$result): void {
    $result[] = 'fourth';

    $value = myFunc();

    $result[] = 'fifth, result from myFunc was: ' . $value;
});

$result[] = 'sixth';
$value = $fiber->start();
$result[] = 'seventh, fiber suspended with: ' . $value;

$fiber->resume('sent to fiber');

$result[] = 'eighth';

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'third',
            'sixth',
            'fourth',
            'first',
            'seventh, fiber suspended with: from fiber',
            'second, resumed with: sent to fiber',
            'fifth, result from myFunc was: my result from myFunc',
            'eighth'
        ]);
    });

    it('should allow a fiber to be run (nested) inside another fiber', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

$result[] = 'first';
$fiber1 = new Fiber(function () use (&$result) {
    $result[] = 'second';

    $fiber2 = new Fiber(function () use (&$result) {
        $result[] = 'third, result from ::suspend(): ' . Fiber::suspend('from fiber 2');
    });

    $result[] = 'fourth';
    $value = $fiber2->start();
    $result[] = 'fifth, from $fiber2->start(): ' . $value;
    $fiber2->resume('sent to fiber 2');

    $result[] = 'sixth';
    Fiber::suspend('from fiber 1');
});

$result[] = 'seventh';
$value = $fiber1->start();
$result[] = 'eighth, from $fiber1->start(): ' . $value;

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'first',
            'seventh',
            'second',
            'fourth',
            'fifth, from $fiber2->start(): from fiber 2',
            'third, result from ::suspend(): sent to fiber 2',
            'sixth',
            'eighth, from $fiber1->start(): from fiber 1'
        ]);
    });

    // Tests interaction of Futures/Pauses when both Fibers and Generators
    // (which both rely on the feature) are at play.
    it('should allow a fiber to be suspended inside a generator', async function () {
        var php = nowdoc(function () {/*<<<EOS
<?php
$result = [];

function myGenerator() : Generator {
    global $result;
    $result[] = 'first';

    $value = Fiber::suspend('from fiber');
    $result[] = 'second';

    yield 'first key' => 'first yield';
    $result[] = 'third, previously resumed with: ' . $value;

    yield 'second key' => 'second yield';
    $result[] = 'fourth';

    return 'my result from myGenerator';
}

$result[] = 'third';
$fiber = new Fiber(function () use (&$result): void {
    $result[] = 'fifth';

    foreach (myGenerator() as $myKey => $myValue) {
        $result[] = 'sixth :: ' . $myKey . ' => ' . $myValue;
    }

    $result[] = 'seventh';
});

$result[] = 'eighth';
$value = $fiber->start();
$result[] = 'ninth, fiber suspended with: ' . $value;

$fiber->resume('sent to fiber');

$result[] = 'tenth';

return $result;
EOS
*/;}), //jshint ignore:line
            module = tools.asyncTranspile('/path/to/my_module.php', php),
            engine = module();

        expect((await engine.execute()).getNative()).to.deep.equal([
            'third',
            'eighth',
            'fifth',
            'first',
            'ninth, fiber suspended with: from fiber',
            'second',
            'sixth :: first key => first yield',
            'third, previously resumed with: sent to fiber',
            'sixth :: second key => second yield',
            'fourth',
            'seventh',
            'tenth'
        ]);
    });
});
