define([
	'../XmlNode'
], function (XmlNode) {
	var report;

	var xmlReporter = {
		start: function () {
			report = new XmlNode('testsuites');
		},

		'/suite/start': function (suite) {
			// There's a top-level Suite (named 'main') that contains all user-created suites
			// We want to skip it
			if (!suite.parent) {
				return;
			}

			var parentNode = report;

			// Handle nested suites
			if (suite.parent && suite.parent._xmlReportNode) {
				parentNode = suite.parent._xmlReportNode;
			}

			suite._xmlReportNode = parentNode.createNode('testsuite');
			suite._startTick = (new Date()).getTime();
		},

		'/suite/end': function (suite) {
			if (!suite.parent) {
				console.log('<?xml version="1.0" encoding="UTF-8" ?>');
				console.log(report.toString());

				report = null;

				return;
			}

			var endTick = (new Date()).getTime();
			var suiteNode = suite._xmlReportNode;
			var numTests = suite.numTests;
			var numFailedTests = suite.numFailedTests;

			suiteNode.attributes = {
				name: suite.name,
				tests: String(numTests),
				failures: String(numFailedTests),
				time: String((endTick - suite._startTick) / 1000)
			};

			delete suite._startTick;
			delete suite._xmlReportNode;
		},

		'/test/pass': function (test) {
			var suiteNode = test.parent._xmlReportNode;
			var testNode;
			var failureNode;
			var errorType;

			testNode = suiteNode.createNode('testcase', {
				name: test.name,
				time: String(test.timeElapsed / 1000)
			});

			if (test.error) {
				if (test.error.constructor && test.error.constructor.name) {
					errorType = test.error.constructor.name;
				}

				if (!errorType) {
					errorType = Object.prototype.toString.call(test.error);
					errorType = errorType.split(' ');
					errorType = errorType[1];
					errorType = errorType.replace(/]$/, '');
				}

				if (errorType === 'Object') {
					errorType = 'Error';
				}

				failureNode = testNode.createNode('failure', {
					type: errorType,
					message: test.message
				});

				failureNode.setContent(test.error.stack || '');
			}
		}
	};

	xmlReporter['/test/fail'] = xmlReporter['/test/pass'];

	return xmlReporter;
});
