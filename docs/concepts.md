# Concepts and Definitions

<!-- vim-markdown-toc GFM -->

* [Test organization](#test-organization)
  * [Assertions](#assertions)
  * [Test interface](#test-interface)
* [Test types](#test-types)
  * [Unit tests](#unit-tests)
  * [Functional tests](#functional-tests)
* [Code coverage](#code-coverage)
* [WebDriver feature tests](#webdriver-feature-tests)
* [Source maps](#source-maps)
* [Page objects](#page-objects)

<!-- vim-markdown-toc -->


## Code coverage

Code coverage is information about what parts of the application code are
exercised during tests. It commonly indicates what percentages of statements,
branches, and functions are executed. Code coverage information is gathered by
“instrumenting” the code being tested. This instrumentation is actually code
that is injected into the code being tested. It records information about the
executing code and stores it in a global variable that Intern retrieves after
the testing is complete.

Intern uses [Istanbul](https://github.com/istanbuljs/istanbuljs) to manage code
coverage. There are three config properties related to instrumentation. The
mostly commonly used one is [coverage], which is used to specify which files
should be instrumented. The other two are [functionalCoverage], a boolean that
indicates whether coverage should be collected during functional tests, and
[instrumenterOptions], which allows options to be passed directly to Istanbul.



[coverage]:
  https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FNode/coverage
[functionalcoverage]:
  https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FNode/functionalcoverage
[instrumenteroptions]:
  https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FNode/instrumenteroptions
