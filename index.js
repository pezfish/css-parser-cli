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
var outputData = '';

program
	.version('0.1.0')
	.option('-f, --file [required]', 'Absolute URL to CSS file to parse')
	.option('-o, --output [required]', 'Path to output csv')
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
	let server = http.createServer(handleRequest);

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

function output(data) {
	fs.writeFile(program.output, data, (error) => {
		if(error) {
			return console.log(error);
		}
	});
}

function createOutputArray(data) {
	let headings = [];
	let row;
	let currPropIndex;

	data.map((obj) => {
		for(let key in obj.declaration) {
			headings.push('"' + obj.declaration[key].property + '"');
		}
	});

	headings = [...new Set(headings)];
	headings.sort();
	headings.unshift('Index', 'Selector', 'Media Query', 'Length', 'Specificity', 'Type');
	outputData += headings.join();
	outputData += '\r';

	data.map((obj) => {
		row = [];
		row.push(obj.index);
		row.push(obj.selector);
		row.push(obj.mediaQuery);
		row.push(obj.length);
		row.push(obj.specificity);
		row.push(obj.type);

		for(let key in obj.declaration) {
			currPropIndex = headings.indexOf('"' + obj.declaration[key].property + '"');
			row[currPropIndex] = '"' + obj.declaration[key].value + '"';
		}

		outputData += row.join();
		outputData += '\r';
	});

	output(outputData);
}

function addAdditionalData(data) {
	processedData = JSON.parse(data);
	processedData.map((obj, index) => {
		obj.index = index;
		obj.length = String(obj.selector).length;
		obj.specificity = parseInt(specificity.calculate(String(obj.selector))[0].specificityArray.join(''), 10);
	});

	createOutputArray(processedData);
}

eventEmitter.on('css-data-received', addAdditionalData);
