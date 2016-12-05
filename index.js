//Lets require/import the HTTP module
var http = require('http');
var exec = require('child_process').exec;

//Lets define a port we want to listen to
const PORT=8080;
var data;

//We need a function which handles requests and send response
function handleRequest(request, response){
	response.end('<!DOCTYPE HTML><link href="//cdn.wcdc.business.comcast.com/bundles/BSEE/css/global" rel="stylesheet"/>');
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
	//Callback triggered when server is successfully listening. Hurray!
	console.log("Server listening on: http://localhost:%s", PORT);
	exec('phantomjs phantom-script.js', (error, stdout, stderr) => {
		if (error) {
			console.error(`exec error: ${error}`);
			return;
		}
		if (stdout) {
			data = JSON.parse(stdout);
			// console.log(JSON.parse(data));
			// console.log(`stdout: ${stdout}`);
			doNextThing();
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`);
		}
		server.close();
	});

	// console.log(data);

});

function doNextThing() {
	console.log(data[0]);
}