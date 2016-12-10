var page = require('webpage').create();
var outputData = {};

page.open('http://localhost:8080', function (status) {
	if(status === 'success') {
		outputData = page.evaluate(
			function () {
				var css = [];
				var cssRules = document.styleSheets[0].cssRules;
				var rule;
				var selectorText;
				var selectors = [];
				var knownType;

				if (!cssRules) {
					console.log('No CSS rules found.');
				}

				/*
					rules : [
						{
							type: <string>,
							index: <int> [node],
							selector: <string>,
							length: <int> [node],
							specificity: <int> [node],
							mediaQuery: <string>,
							declaration: [
								{
									property: <string>
									value: <string>
								}
							]
						}
					]

				*/

				function parseDeclaration(style) {
 					var output = [];
 					var temp;

 					for(var i = 0; i < style.length; i++) {
 						temp = {};
 						temp.property = style[i];
 						temp.value = style[temp.property].replace('http://localhost:8080', '');
 						output.push(temp);
 					}

 					return output;
 				}

				for (var i = 0; i < cssRules.length; i++) {
					knownType = false;

					if (cssRules[i] instanceof window.CSSMediaRule) {
						knownType = true;

						for(var j = 0; j < cssRules[i].cssRules.length; j++) {
							selectorText = cssRules[i].cssRules[j].selectorText.split(',');

							for(var k = 0; k < selectorText.length; k++) {
								rule = {};
								rule.type = cssRules[i].cssRules[j].toString();
								rule.selector = selectorText[k].trim();
								rule.mediaQuery = cssRules[i].media.mediaText;
								rule.declaration = parseDeclaration(cssRules[i].cssRules[j].style);

								css.push(rule);
							}
						}
					}

					if (cssRules[i] instanceof window.CSSStyleRule) {
						knownType = true;
						selectorText = cssRules[i].selectorText.split(',');

						for(var j = 0; j < selectorText.length; j++) {
							rule = {};
							rule.type = cssRules[i].toString();
							rule.selector = selectorText[j].trim();
							rule.mediaQuery = '';
							rule.declaration = parseDeclaration(cssRules[i].style);

							css.push(rule);
						}
					}

					if(!knownType) {
						css.push({
							index: i,
							type: cssRules[i].toString()
						});
					}
				}

				return css;
			}
		);
		console.log(JSON.stringify(outputData, null, 4));
		// console.log(outputData);
	}
	phantom.exit();
});
