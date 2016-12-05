var page = require('webpage').create();
var data;

page.open('http://localhost:8080', function(status) {
  if(status === "success") {
    data = page.evaluate(function() {
    	return document.styleSheets[0].cssRules;
    });

    console.log(JSON.stringify(data));
  }
  phantom.exit();
});
