define([
	'dojo/aspect',
	'dojo/request',
	'dojo/topic'
], function (aspect, request, topic) {
	// Size in pixels to indent tests and nested suites
	var INDENT_SIZE = 18;

	// tbody element to append report rows to
	var reportNode;

	// tr element containing summary info
	var summaryNode;

	// Array of td elements in 'summaryNode'
	var summaryNodes = [];

	// Accumulator for total number of suites
	var suiteCount = 0;

	// Accumulator for total number of tests
	var testCount = 0;

	// Accumulator for total number of failed tests
	var failCount = 0;

	// Clock tick for start of reporter's "start" method
	var startTick = 0;

	var fragment = document.createDocumentFragment();
	var indentLevel = 0;

	// Pad 'val' with leading zeroes up to 'size' length
	function pad(val, /* integer */ size) {
		var padded = String(val);

		while (padded.length < size) {
			padded = '0' + padded;
		}

		return padded;
	}

	// Format a millisecond value to m:ss.SSS
	// If duration is greater than 60 minutes, value will be
	// HHHH:mm:ss.SSS
	// (the hours value will not be converted to days)
	function formatDuration(/* integer */ duration) {
		var hours = Math.floor(duration / 3600000);
		var minutes = Math.floor(duration / 60000) - (hours * 60);
		var seconds = Math.floor(duration / 1000) - (hours * 3600) - (minutes * 60);
		var milliseconds = duration - (hours * 3600000) - (minutes * 60000) - (seconds * 1000);
		var formattedValue = '';

		if (hours) {
			formattedValue = hours + ':';
			minutes = pad(minutes, 2);
		}

		formattedValue += minutes + ':' + pad(seconds, 2) + '.' + pad(milliseconds, 3);

		return formattedValue;
	}

	function renderSummary () {
		var duration = (new Date()).getTime() - startTick;
		var percentPassed = Math.round((1 - (failCount / testCount)) * 10000) / 100;
		var rowInfo = [
			suiteCount,
			testCount,
			failCount,
			percentPassed + '%',
			formatDuration(duration)
		];
		var i;

		for (i = 0; i < rowInfo.length; i++) {
			summaryNodes[i].appendChild(document.createTextNode(rowInfo[i]));
		}
	}


	var htmlReporter = {
		start: function () {
			var headerNode = document.createElement('h1');
			var tableNode;
			var tmpNode;
			var rowNode;
			var cellNode;
			var summaryHeaders = [
				'Suites',
				'Tests',
				'Failed',
				'Success Rate',
				'Duration'
			];
			var i;

			// Page header
			headerNode.appendChild(document.createTextNode('Intern Test Report'));
			fragment.appendChild(headerNode);


			// Summary header
			tmpNode = document.createElement('h2');
			tmpNode.appendChild(document.createTextNode('Summary'));
			fragment.appendChild(tmpNode);


			// Summary table
			tableNode = document.createElement('table');
			tableNode.className = 'report';

			tmpNode = document.createElement('thead');
			rowNode = document.createElement('tr');
			for (i = 0; i < summaryHeaders.length; i++) {
				cellNode = document.createElement('th');
				cellNode.appendChild(document.createTextNode(summaryHeaders[i]));

				if (summaryHeaders[i] === 'Duration') {
					cellNode.className = 'duration';
				}

				rowNode.appendChild(cellNode);
			}
			tmpNode.appendChild(rowNode);
			tableNode.appendChild(tmpNode);

			tmpNode = document.createElement('tbody');
			summaryNode = document.createElement('tr');
			for (i = 0; i < summaryHeaders.length; i++) {
				summaryNodes[i] = document.createElement('td');
				summaryNodes[i].className = 'numeric';
				summaryNode.appendChild(summaryNodes[i]);
			}
			tmpNode.appendChild(summaryNode);
			tableNode.appendChild(tmpNode);
			fragment.appendChild(tableNode);


			// Report header
			tmpNode = document.createElement('h2');
			tmpNode.appendChild(document.createTextNode('Test Suites'));
			fragment.appendChild(tmpNode);


			// Report table
			tableNode = document.createElement('table');
			tableNode.className = 'report';
			reportNode = document.createElement('tbody');
			tableNode.appendChild(reportNode);
			fragment.appendChild(tableNode);

			startTick = (new Date()).getTime();
		},

		'/suite/start': function (suite) {
			// There's a top-level Suite (named 'main') that contains all user-created suites
			// We want to skip it
			if (!suite.parent) {
				return;
			}

			var rowNode = document.createElement('tr');
			var cellNode = document.createElement('td');

			suiteCount++;
			suite._startTick = (new Date()).getTime();

			if (indentLevel) {
				cellNode.style.paddingLeft = (indentLevel * INDENT_SIZE) + 'px';
			}

			cellNode.className = 'title';
			cellNode.innerHTML = suite.name;
			rowNode.className = 'suite';
			rowNode.appendChild(cellNode);
			reportNode.appendChild(rowNode);

			suite._htmlReportNode = rowNode;
			indentLevel++;
		},

		'/suite/end': function (suite) {
			if(!suite.parent){
				renderSummary();

				document.body.innerHTML = '';
				document.body.appendChild(fragment);

				// Skip '/suite/end' for the top-level 'main' suite
				return;
			}

			var rowNode = suite._htmlReportNode;
			var endTick = (new Date()).getTime();
			var numTests;
			var numFailedTests;
			var testInfo;
			var cellNode = document.createElement('td');

			if (suite.get) {
				// intern-geezer only exposes these properties through accessors
				numTests = suite.get('numTests');
				numFailedTests = suite.get('numFailedTests');
			}
			else {
				numTests = suite.numTests;
				numFailedTests = suite.numFailedTests;
			}

			if (numFailedTests) {
				rowNode.className += ' failed';
			}

			testInfo = (numTests - numFailedTests) + '/' + numTests + ' tests passed';
			cellNode.appendChild(document.createTextNode(testInfo));
			rowNode.appendChild(cellNode);

			cellNode = document.createElement('td');
			cellNode.className = 'numeric duration';
			cellNode.appendChild(document.createTextNode(formatDuration(endTick - suite._startTick)));
			rowNode.appendChild(cellNode);

			indentLevel--;

			// Only update the global tracking variables for top-level suites
			if (!indentLevel) {
				testCount += numTests;
				failCount += numFailedTests;
			}

			delete suite._startTick;
			delete suite._htmlReportNode;
		},

		'/test/pass': function (test) {
			var rowNode = document.createElement('tr');
			var cellNode = document.createElement('td');

			if (indentLevel) {
				cellNode.style.paddingLeft = (indentLevel * INDENT_SIZE) + 'px';
			}

			cellNode.appendChild(document.createTextNode(test.name));
			rowNode.appendChild(cellNode);

			cellNode = document.createElement('td');
			if (test.error) {
				rowNode.className = 'failed';
				cellNode.appendChild(document.createTextNode(test.error.message));
			}
			rowNode.appendChild(cellNode);

			cellNode = document.createElement('td');
			cellNode.className = 'numeric duration';
			cellNode.appendChild(document.createTextNode(formatDuration(test.timeElapsed)));
			rowNode.appendChild(cellNode);

			reportNode.appendChild(rowNode);
		}
	};

	htmlReporter['/test/fail'] = htmlReporter['/test/pass'];

	return htmlReporter;
});
