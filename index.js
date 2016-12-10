#!/usr/bin/env node

const path = require('path');
const http = require('http');
const child_process = require('child_process');
const events = require('events');
const fs = require('fs');
const phantomjs = require('phantomjs-prebuilt');
const got = require('got');
const program = require('commander');
const specificity = require('specificity');

const PORT = 8080;

const eventEmitter = new events.EventEmitter();

var cssData;
var processedData;
var data = '';

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
		response.setHeader('content-type', 'text/css');
		response.end(cssData);
	}
}

function createServer() {
	var server = http.createServer(handleRequest);

	server.listen(PORT, () => {
		const spawn = phantomjs.exec('phantom-script.js');
		spawn.stdout.on('data', (chunk) => {
			data += chunk;
		});

		spawn.stdout.on('end', () => {
			eventEmitter.emit('css-data-received', data);
			server.close();
		});

		spawn.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
			server.close();
		});
	});
}

function output(output) {
	console.log(output);
}

function parseData(data) {
	processedData = JSON.parse(data);
	processedData.map((obj, index) => {
		obj.index = index;
		obj.length = String(obj.selector).length;
		obj.specificity = parseInt(specificity.calculate(String(obj.selector))[0].specificityArray.join(''), 10);
	});



	// temp = processedData[1800];
	// output(temp);
}

eventEmitter.on('css-data-received', parseData);
