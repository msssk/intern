# Writing unit tests

<!-- vim-markdown-toc GFM -->

* [Test organization](#test-organization)
  * [Assertions](#assertions)
  * [Test interface](#test-interface)
  * [Unit tests](#unit-tests)
* [Organization](#organization)
* [The test lifecycle](#the-test-lifecycle)
* [Interfaces](#interfaces)
  * [Object](#object)
    * [Nesting suites](#nesting-suites)
    * [Shared data](#shared-data)
  * [TDD](#tdd)
  * [BDD](#bdd)
  * [Benchmark](#benchmark)
  * [Native](#native)
* [Assertions](#assertions)
  * [assert](#assert)
  * [expect](#expect)
  * [should](#should)
* [Unit tests](#unit-tests)
  * [Testing asynchronous code](#testing-asynchronous-code)
  * [Skipping tests at runtime](#skipping-tests-at-runtime)
  * [Test and suite context](#test-and-suite-context)

  * [Functional tests](#functional-tests)
* [Code coverage](#code-coverage)
* [WebDriver feature tests](#webdriver-feature-tests)
* [Source maps](#source-maps)
* [Page objects](#page-objects)

<!-- vim-markdown-toc -->

## Test organization

Intern organizes tests into suites and modules, and allows them to be registered
with various test interfaces.

- **Test module** - A JavaScript module (AMD, CJS, ESM, ...) containing test
  suites
- **Test suite** - A group of related tests. There is typically one top-level
  suite per module.
- **Test case**, or **test** - An individual test
- **[Assertion](#assertions)** - A check for a condition that throws an error if
  the condition isn’t met
- **[Test interface](#test-interface)** - An API used to register test suites

These terms can be visualized in a hierarchy:

- test module
  - test suite
    - test suite
      - test case
        - assertion
        - assertion
        - ...
      - test case
        - assertion
        - ...
      - ...
    - ...
  - test suite
  - ...
- test module
- ...

### Assertions

An assertion is simply a check that throws an error if the check fails, like:

```ts
if (value !== 5) {
  throw new Error(`Expected ${value} to be 5`);
}
```

No special library is required to make assertions. However, assertion libraries
can make tests easier to understand, and can automatically generate meaningful
failure messages. Using the [Chai](https://chaijs.com) assertion library
included with Intern, the above assertion could be written as:

```ts
assert.equal(value, 5);
```

If the assertion fails, Chai will construct a meaningful error message that
includes the expected and actual values.

### Test interface

A test interface is an API used to register tests. For example, many testing
frameworks use a "BDD" interface, with `describe` and `it` functions, where
`describe` creates a suite and `it` creates an individual test. Intern includes
several interfaces:

- **BDD**
- **TDD**, which uses `suite` and `test` functions in place of `describe` and
  `it`
- **Object**, which allows suites to be defined using objects
- **Benchmark**, an object-like interface for registering benchmark tests

<!-- TODO: Add a link to the QUnit plugin -->

A [QUnit](http://qunitjs.com) interface is available through a plugin.

### Unit tests

Unit tests test code directly, typically by instantiating an application class
and calling methods, or by calling application functions, and then making
assertions about the results.

Since Intern unit tests call application code directly, they need to run in the
same environment as the test code itself. This typically means running Intern in
the browser to test browser-specific code, and in Node for Node code. This
limitation can be circumvented by using mocks/fakes/stubs; for example, many
browser-based projects use a virtual DOM implementation to allow unit tests for
browser code to run in a Node environment. (It’s less common to want to go the
other way.)

A unit test might look like:

```ts
import Component from 'app/Component';
const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
registerSuite('Component', {
    '#add'() {
        // Assume 'Component' is a class with 'add' and 'get' methods
        const comp = new Component();
        comp.add({ id: 'foo', value: 'bar' };
        assert.strictEqual(comp.get('foo'), 'bar');
    }
});
```

In the example above, the '#add' test instantiates a Component instance, calls a
method on it, then makes an assertion about the result. If the assertion fails,
it throws an error message. The test could just as easily have done an equality
check itself:

```ts
if (comp.get('foo') !== 'bar') {
  throw new Error('not equal');
}
```

However, using an [assertion library](#assertions) will generate errors with
meaningful messages automatically, which is pretty convenient.

## Organization

Suites are typically grouped into script files, with one top-level suite per
file. How the files themselves are structured depends on how the suite files
will be [loaded](./architecture.md#loader). For example, if the ‘dojo’ loader is
used to load suites, an individual suite file would be an AMD or UMD module:

```js
define(['app/Component'], function(Component) {
  const { assert } = intern.getPlugin('chai');
  const { registerSuite } = intern.getPlugin('interface.object');

  registerSuite('Component', {
    'create new'() {
      assert.doesNotThrow(() => new Component());
    }
  });
});
```

On other hand, if the loader is using SystemJS + Babel to load suites, a suite
file could be an ESM module:

```ts
import Component from '../app/Component';

const { assert } = intern.getPlugin('chai');
const { registerSuite } = intern.getPlugin('interface.object');

registerSuite('Component', {
  'create new'() {
    assert.doesNotThrow(() => new Component());
  }
});
```

## The test lifecycle

When tests are executed, the test system follows a specific lifecycle:

- For each registered root suite...
  - The suite’s `before` method is called, if it exists
  - For each test within the suite...
    - The suite’s `beforeEach` method is called, if it exists
    - The test function is called
    - The suite’s `afterEach` method is called, if it exists
  - The suite’s `after` method is called, if it exists

For nested suites, `beforeEach` lifecycle methods are run from the outside in;
first the outermost parent’s `beforeEach` is run, then the next level in, and so
on until the suite’s own `beforeEach`, which is run last. The `afterEach`
lifecycle methods are run in the reverse order; first the suite’s own
`afterEach` is run, then its parent’s, and so on until the outermost suite.

Given the following test module...

```ts
const { registerSuite } = intern.getPlugin('interface.object');

registerSuite({
  before() {
    console.log('outer before');
  },

  beforeEach() {
    console.log('outer beforeEach');
  },

  afterEach() {
    console.log('outer afterEach');
  },

  after() {
    console.log('outer after');
  },

  tests: {
    'inner suite': {
      before() {
        console.log('inner before');
      },
      beforeEach() {
        console.log('inner beforeEach');
      },
      afterEach() {
        console.log('inner afterEach');
      },
      after() {
        console.log('inner after');
      },

      tests: {
        'test A'() {
          console.log('inner test A');
        },
        'test B'() {
          console.log('inner test B');
        }
      }
    },

    'test C': function() {
      console.log('outer test C');
    }
  }
});
```

...the resulting console output would be:

```
outer before
inner before
outer beforeEach
inner beforeEach
inner test A
inner afterEach
outer afterEach
outer beforeEach
inner beforeEach
inner test B
inner afterEach
outer afterEach
inner after
outer beforeEach
outer test C
outer afterEach
outer after
```

## Interfaces

There are several ways to write tests. The most common will be to use one of
Intern’s built-in interfaces, such as the object interface. Another possibility
is to register tests or suites directly on the Intern executor.

Interfaces may be accessed using the `getPlugin('interface.xyz')` method, or by
importing an interface directly if a module loader is in use. Note that since
interfaces are independent from the rest of the testing system, multiple
interfaces may be used at the same time (e.g., some suites could be written with
the object interface and others with BDD).

### Object

This is the default interface used for Intern’s self-tests and most examples. A
suite is a simple object, and tests are functions on that object.

```ts
// tests/unit/component.ts
const { registerSuite } = intern.getPlugin('interface.object');

registerSuite('Component', {
  'create new'() {
    assert.doesNotThrow(() => new Component());
  },

  'update values'() {
    const component = new Component();
    component.update({ value: 20 });
    assert.equal(component.children[0].value, 20);
  }
});
```

The property used to describe a suite has the basic format:

```ts
{
    // Suite properties, such as lifecycle functions
    beforeEach() {},
    afterEach() {},
    timeout: 500,

    tests: {
        // Tests or nested suites
        test1() {},
        test2() {},
    }
}
```

However, when no Suite properties are being provided (e.g., `beforeEach`,
`afterEach`, etc.) the tests can be directly on the suite object:

```ts
{
    test1() { },
    test2() { },
    // ...
}
```

The presence of a `tests` property determines how Intern will treat an object
suite descriptor. If a `tests` property is present, other properties are assumed
to be suite properties. If a `tests` property is not present, then all
properties on the descriptor are assumed to be tests.

#### Nesting suites

Suites can be nested by using a suite descriptor as a test:

```ts
registerSuite('Component', {
    foo() {
        assert.doesNotThrow(() => new Component());
    },

    bar() {
        const component = new Component();
        component.update({ value: 20 });
        assert.equal(component.children[0].value, 20);
    }

    'sub suite': {
        baz() {
            // A test in the sub-suite
        },

        bif() {
            // Another sub-suite test
        }
    }
});
```

#### Shared data

If tests need to share variables, it’s good practice to initialize the suite
with a function rather than directly with a suite object. This will ensure that
if a suite is loaded more than once, such as a functional test suite being
loaded for different remote environments, each instance will have its own copies
of the shared variables. Do this:

```ts
registerSuite('foo', () => {
  let counter = 0;
  let app;

  return {
    before() {
      app = new App(counter++);
    },

    tests: {
      'validate counter'() {
        assert.strictEqual(app.id, counter - 1);
      }
    }
  };
});
```

instead of this:

```ts
let counter = 0;
let app;

registerSuite('foo', {
  before() {
    app = new App(counter++);
  },

  tests: {
    'validate counter'() {
      assert.strictEqual(app.id, counter - 1);
    }
  }
});
```

A similar tactic may be used when tests in a sub-suite need to share data but
that data should only be visible to the sub-suite:

```ts
registerSuite('foo', {
    test1() {
    }

    test2() {
    }

    subSuite: (() => {
        let counter = 0;
        let app;

        return {
            before() {
                app = new App(counter++);
            },

            tests: {
                'validate counter'() {
                    assert.strictEqual(app.id, counter - 1);
                }
            }
        };
    })()
});
```

### TDD

Registering suites and tests using the TDD interface is more procedural than the
[object interface](#object).

```ts
const { suite, test } = intern.getPlugin('interface.tdd');
const { assert } = intern.getPlugin('chai');

suite('Component', () => {
  test('create new', () => {
    assert.doesNotThrow(() => new Component());
  });

  test('update values', () => {
    const component = new Component();
    component.update({ value: 20 });
    assert.equal(component.children[0].value, 20);
  });
});
```

Suites may be nested by calling `suite` within a suite callback. However,
calling `suite` within a test function isn't supported.

```ts
suite('Component', () => {
  test('create new', () => {});

  suite('sub suite', () => {
    test('test1', () => {});
  });
});
```

Unlike the object interface, the TDD interface allows multiple copies of a
lifecycle method to be added to a single suite. For example, a suite may call
`before` multiple times to set multiple before callbacks.

```ts
suite('Component', () => {
  before(() => {
    // Setup code
  });

  before(() => {
    // Additional setup code
  });

  // ...
});
```

### BDD

The BDD interface is nearly identical to the TDD interface, differing only in
the names of its test and suite registration functions (`describe` and `it`
rather than `suite` and `test`).

```ts
const { describe, it } = intern.getPlugin('interface.bdd');
const { assert } = intern.getPlugin('chai');

describe('Component', () => {
  it('should not throw when created', () => {
    assert.doesNotThrow(() => new Component());
  });

  it('should render updated values', () => {
    const component = new Component();
    component.update({ value: 20 });
    assert.equal(component.children[0].value, 20);
  });
});
```

### Benchmark

The benchmark interface is an extension of the [object interface](#object) used
to register [benchmark suites](#benchmark-tests). Tests in benchmark suites are
concerned with code _performance_ rather than code _correctness_. The interface
looks very similar to the object interface.

```ts
const { registerSuite, async } = intern.getPlugin('interface.benchmark');
let component: Component;

registerSuite('Component performance', {
    beforeEach() {
        component = new Component();
    },

    afterEach() {
        component = null;
    }

    tests: {
        'update values'() {
            component.update({ value: 20 });
        }
    }
});
```

The `async` function is used to identify asynchronous benchmark tests as the
standard [this.async](#testing-asynchronous-code) method doesn’t work properly
with benchmark tests.

```ts
registerSuite('Performance', {
    // ...

    'update values'() {
        component.update({ value: 20 });
    },

    // An async test will be passed a Deferred object
    async(request(dfd) {
        component.request('something.html').then(
            () => { dfd.resolve(); },
            error => { dfd.reject(error); }
        );
    })
});
```

The benchmark interface also supports two additional lifecycle methods,
`beforeEachLoop` and `afterEachLoop`. The test lifecycle for a benchmark test is
a bit different than for other types of test. A single benchmark test involves
running a test function many times in succession. The total of all of these runs
is the “test”, and this is what the standard `beforeEach` and `afterEach`
callbacks run before and after. The `beforeEachLoop` and `afterEachLoop` run
before and after each call of the test function in a run.

> ⚠️ Note that because of limitations in Benchmark.js, `beforeEachLoop` and
> `afterEachLoop` _must_ be synchronous, and cannot be wrapped in `async`.

Benchmark tests may also provide options directly to [Benchmark.js] by attaching
them to the test function.

```ts
registerSuite('foo', {
    'basic test': (() => {
        test() {
            // benchmark
        }

        test.options = {
            // Benchmark.js options
        };

        return test;
    })();
});
```

> ⚠️ Note that providing `setup` and `teardown` functions in an `options` object
> is not supported. Intern will always override these functions with its own
> lifecycle code. Instead, use `beforeEachLoop` and `afterEachLoop`.

### Native

The native interface is simply the
[addSuite](https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FExecutor/addsuite)
method on Executor, which is what the various test interfaces use behind the
scenes to register tests and suites. This method takes a factory function that
will be called with a Suite. The factory function should add suites or tests to
the given suite using the suite’s `add` method.

```ts
intern.addSuite(parent => {
  const suite = new Suite({
    name: 'create new',
    tests: [
      new Test({
        name: 'new test',
        test: () => assert.doesNotThrow(() => new Component())
      })
    ]
  });
  parent.add(suite);
});
```

## Assertions

Tests should throw errors when some feature being tested doesn’t behave as
expected. The standard `throw` mechanism will work for this purpose, but
performing a particular test and constructing meaningful error messages can be
tedious. Assertion libraries exist that can simplify this process. Intern
bundles the [chai](http://chaijs.com) assertion library, and exposes it it via
the plugin system as “chai”.

```ts
const { assert } = intern.getPlugin('chai');
```

When running with a module loader or in Node, Chai can be imported directly.

Chai provides three assertion interfaces:
[assert](http://chaijs.com/api/assert/), [expect](http://chaijs.com/api/bdd/),
and [should](http://chaijs.com/api/bdd/).

### assert

This is the interface used by most of the examples in this documentation.

```ts
const { assert } = intern.getPlugin('chai');
// ...
assert.strictEqual(count, 5, 'unexpected value for count');
```

> 💡 When using the assert API, an easy way to remember the order of arguments
> is that they’re alphabetical: actual, expected, message.

### expect

```ts
const { expect } = intern.getPlugin('chai');
// ...
expect(count).to.equal(5, 'unexpected value for count');
```

### should

```ts
// Note that `should` needs to be called to be properly initialized
const should = intern.getPlugin('chai').should();
// ...
count.should.equal(5, 'unexpected value for count');
```

> ⚠️ This API modifies the global `Object.prototype` and doesn’t work with
> null/undefined values or objects that don't inherit from `Object.prototype`.

## Unit tests

[Unit tests](./concepts.md#unit-tests) are probably the most common type of
test. All of the example tests on this page have been unit tests. These work by
directly loading a part of the application, exercising it, and verifying that it
works as expected. For example, the following test checks that an `update`
method on some Component class does what it’s supposed to:

```ts
'update values'() {
    const component = new Component();
    component.update({ value: 20 });
    assert.equal(component.value, 20);
}
```

This test instantiates an object, calls a method on it, and makes an assertion
about the resulting state of the object (in this case, that the component’s
`value` property has a particular value). This test assumes the `update` method
on component is synchronous; it would be very similar if the update method were
asynchronous using Promises:

```ts
'update values'() {
    const component = new Component();
    return component.update({ value: 20 }).then(() => {
        assert.equal(component.value, 20);
    });
}
```

or using callbacks:

```ts
'update values'() {
    const dfd = this.async();
    const component = new Component();
    component.update({ value: 20 }, dfd.callback(error => {
        assert.equal(component.value, 20);
    }));
}
```

### Testing asynchronous code

The examples on this page have all involved synchronous code, but tests may also
execute asynchronous code. When a test is async, Intern will wait for a
notification that the test is finished before starting the next test. There are
two ways to let Intern know a test is async:

1.  Call [this.async] (or `test.async`) to get a Deferred object, and then
    resolve or reject that Deferred when the test is finished, or
2.  Return a Promise

Internally both cases are handled in the same way; Intern will wait for the
Deferred object created by the call to `async`, or for a Promise returned by the
test, to resolve before continuing. If the Deferred or Promise is rejected, the
test fails, otherwise it passes.

```ts
import { get as _get } from 'http';
import { promisify } from 'util';
const get = promisify(_get);

registerSuite('async demo', {
  'async test'() {
    const dfd = this.async();
    get(
      'http://example.com/test.txt',
      dfd.callback((error, data) => {
        if (error) {
          throw error;
        }
        assert.strictEqual(data, 'Hello world!');
      })
    );
  },

  'Promise test'() {
    return get('http://example.com/test.txt').then(data =>
      assert.strictEqual(data, 'Hello world!')
    );
  }
});
```

If the Deferred or Promise takes too long to resolve, the test will timeout
(which is considered a failure). The timeout can be adjusted by

- passing a new timeout value to `async`
- by setting the test’s `timeout` property
- by changing [defaultTimeout] in the test config

All are values in milliseconds.

```ts
const dfd = this.async(5000);
```

or

```ts
this.timeout = 5000;
```

### Skipping tests at runtime

Tests have a [skip](https://theintern.io/docs.html#Intern/4/api/lib%2FTest/skip)
method that can be used to skip the test if it should not be executed for some
reason.

```ts
registerSuite('skip demo', {
  'skip test'() {
    if (typeof window === 'undefined') {
      this.skip('browser-only test');
    }

    // ...
  }
});
```

> 💡Calling `this.skip` immediately halts test execution, so there is no need to
> call `return` after `skip`.

The Suite class also provides a
[skip](https://theintern.io/docs.html#Intern/4/api/lib%2FSuite/skip) method.
Calling `this.skip()` (or `suite.skip()`) from a suite lifecycle method, or
calling `this.parent.skip()` from a test, will cause all remaining tests in a
suite to be skipped.

Intern also provides a [grep] configuration option that can be used to skip
tests and suites by ID.

```json5
// intern.json
{
  suites: 'tests/unit/*.js',
  // Only tests with "skip demo" in their ID will be run
  grep: 'skip demo'
}
```

> 💡Note that a test ID is the concatenation of its parent suite ID and the test
> name (and a suite ID is the concatenation of _it’s_ parent suite ID and the
> suite’s own name, etc.).

### Test and suite context

Test methods are always called in the context of the test object itself.
Consider the following case that uses the TDD interface:

```ts
test('update values', function() {
  const dfd = this.async();
  const component = new Component();
  component.update(
    { value: 20 },
    dfd.callback(error => {
      assert.equal(component.children[0].value, 20);
    })
  );
});
```

The use of `this.async()` works because the test callback is called with the
containing Test instance as its context. Similarly, suite lifecycle methods such
as `before` and `afterEach` are called in the context of the suite object. The
`beforeEach` and `afterEach` methods are also passed the current test as the
first argument.

This manner of calling test methods doesn’t work so well with arrow functions:

```ts
test('update values', () => {
  const dfd = this.async(); // <--- Problem -- this isn't bound to the Test!
  // ...
});
```

To making working with arrow functions easier, Intern also passes the Test
instance as the first argument to test callbacks, and as the first argument to
test-focused suite lifecycle functions (`beforeEach` and `afterEach`). It passes
the Suite instance as the first argument to the `before` and `after` Suite
callback functions, and as the second argument to `beforeEach` and `afterEach`.

```ts
test('update values', test => {
  const dfd = test.async();
  // ...
});
```
