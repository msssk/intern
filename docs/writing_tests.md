# Writing Tests

At the most basic level, a test is a function that either runs to completion or
throws an error. Intern groups tests into suites, and runs the suites when
`intern.run()` is called. The first few sections in this document cover the
basics of writing and organizing tests. Later sections describe the differences
between types of tests in more detail.

<!-- vim-markdown-toc GFM -->

  * [Environment](#environment)
* [Benchmark tests](#benchmark-tests)
* [Functional tests](#functional-tests)
  * [Page objects](#page-objects)
  * [Testing native apps](#testing-native-apps)
    * [Appium](#appium)
    * [ios-driver](#ios-driver)
    * [Selendroid](#selendroid)
  * [Debugging](#debugging)

<!-- vim-markdown-toc -->


[benchmark]:
  https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FExecutor/benchmark
[benchmark.js]: https://benchmarkjs.com
[defaulttimeout]:
  https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FExecutor/defaulttimeout
[environments]: ./configuration.md#environments
[functionalsuites]:
  https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FNode/functionalsuites
[grep]:
  https://theintern.io/docs.html#Intern/4/api/lib%2Fexecutors%2FExecutor/grep
[this.async]: https://theintern.io/docs.html#Intern/4/api/lib%2FTest/async
[suite]: https://theintern.io/docs.html#Intern/4/api/lib%2FSuite
[test]: https://theintern.io/docs.html#Intern/4/api/lib%2FTest
