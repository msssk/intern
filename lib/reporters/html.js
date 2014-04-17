define([
	'dojo/aspect',
	'dojo/request',
	'dojo/topic'
], function (aspect, request, topic) {
	// Size in pixels to indent tests and nested suites
	var INDENT_SIZE = 18;

	// style element for injected CSS
	var styleNode = document.createElement('style');

	// tbody element to append report rows to
	var reportNode;

	// tr element containing summary info
	var summaryNode;

	// Accumulator for total number of suites
	var suiteCount = 0;

	// Accumulator for total number of tests
	var testCount = 0;

	// Accumulator for total number of failed tests
	var failCount = 0;

	// Clock tick for start of reporter's "start" method
	var startTick = 0;

	// Flag used to skip the top-level Intern-generated suite
	var isFirstSuite = true;

	var indentLevel = 0;

	// Pad 'val' with leading zeroes up to 'size' (number) length
	function pad(val, size) {
		var padded = String(val);

		while (padded.length < size) {
			padded = '0' + padded;
		}

		return padded;
	}

	// Format a millisecond value to 0:00.000
	function formatDuration(duration) {
		var minutes = 0;
		var seconds = 0;
		var milliseconds;

		if (duration >= 60000) {
			minutes = Math.floor(duration / 60000);
		}

		if (duration >= 1000) {
			seconds = Math.floor(duration / 1000);
		}

		milliseconds = duration - (minutes * 60000) - (seconds * 1000);

		return minutes + ':' + pad(seconds, 2) + '.' + pad(milliseconds, 3);
	}

	// The "stop" method is apparently never called, so we don't know when testing is completed,
	// so summary data is rendered each time '/suite/end' is published
	function renderSummary () {
		var duration = (new Date()).getTime() - startTick;
		var percentPassed = Math.round((1 - (failCount / testCount)) * 10000) / 100;
		var rowInfo = [
			suiteCount,
			testCount,
			failCount,
			percentPassed + '%',
			{
				className: 'numeric',
				data: formatDuration(duration)
			}
		];
		var i;

		for (i = 0; i < rowInfo.length; i++) {
			cellNode = summaryNode.children[i];

			if (rowInfo[i].className) {
				cellNode.className = rowInfo[i].className;
			}

			cellNode.innerHTML = rowInfo[i].data || rowInfo[i];
		}
	}


	var htmlReporter = {
		start: function () {
			var headerNode = document.createElement('h1');
			var tableNode;
			var tmpNode;

			request.get('lib/reporters/html.css').then(function (styles) {
				// For IE
				if (styleNode.styleSheet) {
					styleNode.styleSheet.cssText = styles;
				} else {
					styleNode.appendChild(document.createTextNode(styles));
				}

				document.head.appendChild(styleNode);
			});

			headerNode.appendChild(document.createTextNode('Intern Test Report'));
			document.body.appendChild(headerNode);

			tmpNode = document.createElement('h2');
			tmpNode.appendChild(document.createTextNode('Summary'));
			document.body.appendChild(tmpNode);

			tableNode = document.createElement('table');
			tableNode.className = 'report';

			tmpNode = document.createElement('thead');
			tmpNode.innerHTML = '<tr>' +
				'<th>Suites</th>' +
				'<th>Tests</th>' +
				'<th>Failed</th>' +
				'<th>Success Rate</th>' +
				'<th class="duration">Duration</th>' +
				'</tr>';
			tableNode.appendChild(tmpNode);

			tmpNode = document.createElement('tbody');
			summaryNode = document.createElement('tr');
			summaryNode.innerHTML = '<td class="numeric"></td><td class="numeric"></td><td class="numeric"></td>' +
				'<td class="numeric"></td><td class="numeric"></td>';
			tmpNode.appendChild(summaryNode);
			tableNode.appendChild(tmpNode);
			document.body.appendChild(tableNode);

			tmpNode = document.createElement('h2');
			tmpNode.appendChild(document.createTextNode('Test Suites'));
			document.body.appendChild(tmpNode);

			tableNode = document.createElement('table');
			tableNode.className = 'report';
			reportNode = document.createElement('tbody');
			tableNode.appendChild(reportNode);
			document.body.appendChild(tableNode);

			startTick = (new Date()).getTime();
		},

		'/suite/start': function (suite) {
			// There's a top-level Suite named 'main' that contains all user-created suites
			// We want to skip it
			if (isFirstSuite && suite.name === 'main') {
				isFirstSuite = false;
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
			cellNode.innerHTML = '&#x25B8; ' + suite.name;
			rowNode.className = 'suite';
			rowNode.appendChild(cellNode);
			reportNode.appendChild(rowNode);

			suite._htmlReportNode = rowNode;
			indentLevel++;
		},

		'/suite/end': function (suite) {
			var rowNode = suite._htmlReportNode;
			var endTick = (new Date()).getTime();
			var testInfo = (suite.numTests - suite.numFailedTests) + '/' + suite.numTests + ' tests passed';
			var cellNode = document.createElement('td');

			if (suite.numFailedTests) {
				rowNode.className += ' failed';
			}

			cellNode.appendChild(document.createTextNode(testInfo));
			rowNode.appendChild(cellNode);

			cellNode = document.createElement('td');
			cellNode.className = 'numeric duration';
			cellNode.appendChild(document.createTextNode(formatDuration(endTick - suite._startTick)));
			rowNode.appendChild(cellNode);

			indentLevel--;
			testCount += suite.numTests;
			failCount += suite.numFailedTests;

			renderSummary();

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
