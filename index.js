#!/usr/bin/env node

const path = require('path');
const http = require('http');
const child_process = require('child_process');
const events = require('events');
const fs = require('fs');
const phantomjs = require('phantomjs-prebuilt');
const got = require('got');
const program = require('commander');

const PORT = 8080;
const phantomBinPath = phantomjs.path;
const phantomArgs = [
	path.join(__dirname, 'phantom-script.js')
];
const eventEmitter = new events.EventEmitter();

var cssData;

program
	.version('0.1.0')
	.option('-f, --file [required]', 'Absolute URL to CSS file to parse')
	.parse(process.argv);

got(program.file)
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
				eventEmitter.emit('css-data-received', stdout);
				server.close();
			}
		});
	});
}

function processCSSData(data) {
	console.log(data);
}

eventEmitter.on('css-data-received', processCSSData);
