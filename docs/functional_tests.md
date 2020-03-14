
### Functional tests

Also known as WebDriver tests (after the
[W3C standard](https://www.w3.org/TR/webdriver/)), functional tests test code
indirectly. While a unit test calls application functions and examines return
values, a functional test manipulates the code in the same way a typical user
might, by opening pages, clicking buttons, and filling in form fields.

Functional tests in Intern typically use the
[Leadfoot](https://theintern.github.io/leadfoot) WebDriver library to control
remote browsers. A functional test might look like:

```ts
const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
registerSuite('home page', {
  login() {
    return (
      this.remote
        .get('http://mysite.local/page.html')
        .findById('username')
        .type('bob')
        .end()
        .findById('password')
        .type('12345')
        .end()
        .findById('submit')
        .click()
        .sleep(1000)
        // Assume the logged in site has a '#banner' element
        .findById('banner')
    );
  }
});
```

Note that the functional test doesn't load any application code. Instead, it
uses the `this.remote` object to load a page in a remote browser and interact
with it. There's no explicit assertion in this case, either. Searching for the
'banner' element serves as a test assertion, because the chain of Promises
started from `this.remote` will reject if the element isn’t found (and Intern
will record that as a failure).

## Functional tests

[Functional tests](./concepts.md#functional-tests) operate fundamentally
differently than unit tests. While a unit test directly loads and executes
application code, functional tests load a page in a browser and interact with it
in the same way a user would: by examining the content of the page, clicking
buttons, typing into text inputs, etc. This interaction is managed through a
`remote` property that is available to functional tests.

Functional tests are registered using the same interfaces as
[unit tests](#unit-tests), and use the same [Suite] and [Test] objects, but are
loaded using the [functionalSuites] property. The key difference is that instead
of executing application code directly, functional tests use a
[Leadfoot Command object](https://theintern.io/docs.html#Leadfoot/2/api/Command/command-1),
available as a `remote` property on the test, to automate interactions that
you’d normally perform manually.

Consider the following functional test:

```ts
'login works'() {
    return this.remote
        .get('index.html')
        .findById('username')
        .type('scroob')
        .end()
        .findById('password')
        .type('12345')
        .end()
        .findById('login')
        .click()
        .end()
        .sleep(5000)
        .findByTagName('h1')
        .getVisibleText()
        .then(text => {
            assert.equal(text, 'Welcome!');
        });
}
```

This test performs the following steps:

1.  Loads the page 'index.html' in the browser associated with the current test
    session (Intern can drive multiple browsers at a time)
2.  Finds an element on the page with DOM ID ‘username’ and types ‘scroob’ into
    it
3.  Finds the element with ID ‘password’ and types ‘12345’ into it
4.  Finds the element with ID ‘login’ and clicks it
5.  Waits a few seconds
6.  Finds an H1 element
7.  Verifies that it contains the text ‘Welcome!’

One key point to keep in mind is that interaction with a browser is async, so
all functional tests must be async. This is actually pretty simple to deal with.
The API provided by `this.remote` is the Leadfoot
[Command API](https://theintern.io/docs.html#Leadfoot/2/api/Command/command-1),
which is fluid and async, and the result of a bunch of fluid Command method
calls will be something that looks like a Promise. A functional test just needs
to return the result of this Command chain, and Intern will treat it as async.

> ⚠️ Always make sure to return the final call to the remote object, or return a
> Promise that resolves after the functional test is complete. Otherwise Intern
> won’t wait for your functional test to finish before moving on to the next
> test.

### Page objects

Typically a given page may be used in multiple functional tests, and tests may
perform a lot of the same actions on a given page.
[Page objects](./concepts.md#page-objects) are one way of reducing repetition
and improving maintainability. They are typically implemented for Intern using
functions that return callback functions, like the following:

```ts
// loginPage.ts
export function login(username: string, password: string) {
  return function() {
    return this.parent
      .findById('login')
      .click()
      .type(username)
      .end()
      .findById('password')
      .click()
      .type(password)
      .end()
      .findById('loginButton')
      .click()
      .end()
      .setFindTimeout(5000)
      .findById('loginSuccess')
      .end();
  };
}
```

Each page object function returns a function. This returned function will be
used as a `then` callback. To actually use a page object function, just call it
and use the return value for a `then` callback:

```ts
// productPage.ts
import { login } from './pages/loginPage.ts';

registerSuite('product page', {
  'buy product'() {
    return (
      this.remote
        .get('https://mysite.local')
        .then(login(username, password))

        // now buy the product
        .findById('product-1')
        .click()
        .end()
    );
    // ...
  }

  // ...
});
```

## Page objects

"Page objects" are very useful functional testing concept. The basic idea is to
define a page-level API for a page that a test will be interacting with. For
example, functional tests may need to login to a site:

```ts
// productPage.ts
registerSuite('product page', {
  'buy product'() {
    return (
      this.remote
        .get('https://mysite.local')

        // Login to the site, using the specified username and password, then look for a
        // specific element to verify that the login succeeded
        .findById('login')
        .click()
        .type(username)
        .end()
        .findById('password')
        .click()
        .type(password)
        .end()
        .findById('loginButton')
        .click()
        .end()
        .setFindTimeout(5000)
        .findById('loginSuccess')
        .end()

        // now buy the product
        .findById('product-1')
        .click()
        .end()
    );
    // ...
  }

  // ...
});
```

The login logic could be extracted to a page object, resulting a much simpler
test:

```ts
// productPage.ts
import { login } from './pages/loginPage.ts';

registerSuite('product page', {
  'buy product'() {
    return (
      this.remote
        .get('https://mysite.local')
        .then(login(username, password))

        // now buy the product
        .findById('product-1')
        .click()
        .end()
    );
    // ...
  }

  // ...
});
```

### Debugging

When debugging functional tests, keep in mind that JavaScript code is running in
two separate environments: functional test suites are running in Node.js, while
the page being tested is running in a web browser. Functional tests themselves
can be debugged using Node’s `--inspect` or `--inspect-brk` command line
options.

1.  Set a breakpoint in your test code by adding a `debugger` statement.
2.  Launch Node.js in inspect mode
    ```
    $ node --inspect-brk node_modules/.bin/intern
    ```
3.  Start Chrome and connect to the address and port provided by Node
4.  Continue execution (F8). The tests will run to the debugger statement.
5.  Debug!

## WebDriver feature tests

Although WebDriver, and the JSON wire protocol before it, provide a standard
communication protocol for interacting with remote browsers, they do not
completely specify how remote browsers should implement various actions.
Different browsers, and the same browser on different platforms, don't always
respond to WebDriver commands in the same way, and may not even implement some
commands. Rather than assume every remote browser behaves according to the
WebDriver standard, Intern runs a series of tests each time it opens a remote
browser connection. These tests determine which features are supported and which
aren’t, and also whether various behaviors are broken or work in a non-standard
fashion. Intern uses the results of these tests to try to standardize behavior
across browsers and platforms, so that a test writer doesn't have to customize
tests for different browsers and platforms.

These feature tests can be partially or fully disabled using the
`fixSessionCapabilities` property in a browser
[environment descriptor](https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FNode/environments).
Setting this value to `false` disables feature tests, while setting it to
`'no-detect'` sets properties that are known to apply to the current browser,
but doesn’t run any tests.
