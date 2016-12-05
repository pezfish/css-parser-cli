const path = require('path');
const http = require('http');
const child_process = require('child_process');
const events = require('events');
const fs = require('fs');
const phantomjs = require('phantomjs-prebuilt');
const got = require('got');


const PORT = 8080;
const phantomBinPath = phantomjs.path;
const phantomArgs = [
	path.join(__dirname, 'phantom-script.js')
];
const eventEmitter = new events.EventEmitter();

var cssData;

got('https://www.thinkbrownstone.com/wp-content/themes/tbiv2/css/main.min.css')
	.then(response => {
		cssData = response.body;
		createServer();
	});

function handleRequest(request, response) {
	if(request.url === '/') {
		response.end('<!DOCTYPE HTML><link href="/stylesheet.css" rel="stylesheet"/>');
	}

	if(request.url === '/stylesheet.css') {
		response.end(cssData);
	}
}

function createServer() {
	var server = http.createServer(handleRequest);

	server.listen(PORT, () => {
		child_process.execFile(phantomBinPath, phantomArgs, (err, stdout, stderr) => {
			if(stdout) {
				// console.log(stdout);
				eventEmitter.emit('css-data-received', stdout);
				// server.close();
			}
		});
	});
}

function processCSSData(data) {
	fs.writeFile('tmp/output', data);
	// console.log(data);
}

eventEmitter.on('css-data-received', processCSSData);
