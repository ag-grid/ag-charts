#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SUMMARY_DATA_FILE_PATH = 'packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts';

const projectRoot = path.join(__dirname, '../..');
const summaryExampleDataFile = path.join(projectRoot, SUMMARY_DATA_FILE_PATH);
const dataFile = fs.readFileSync(summaryExampleDataFile, 'utf-8').replace('export function', 'function');
const data = eval(`${dataFile}; getData()`);
const versions = data.map(({ name }) => `origin/${name}`);

process.stdout.write([...versions, ''].join('\n'));
