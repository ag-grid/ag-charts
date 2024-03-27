#!node

const fs = require('fs');
const glob = require('glob');
const path = require('path');
const child_process = require('child_process');
const prettier = require('prettier');

const args = process.argv.slice(2);

const currentBranch = args[0] ?? child_process.execSync(`git branch --show-current`).toString().split('\n')[0];
const reportsPathPrefix = args[1] ?? '';

function readReports() {
    const rootDir = path.resolve(process.cwd(), path.join(reportsPathPrefix, 'reports'));

    console.info(`Checking ${rootDir} for reports...`);
    const files = glob.sync('**/benchmarks/*.test.json', {
        cwd: rootDir,
        absolute: true,
    });

    let result = {};
    for (const file of files ?? []) {
        console.info(`Parsing ${file}...`);

        const stats = JSON.parse(fs.readFileSync(file).toString());
        result = {
            ...result,
            ...stats,
        };
    }

    return result;
}

const summaryExampleDataFile = 'packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts';
function updateSummaryExample(results) {
    console.info(`Reading ${summaryExampleDataFile}...`);
    let dataFile = fs.readFileSync(summaryExampleDataFile).toString();
    dataFile = dataFile.replace('export function', 'function');

    const data = eval(`${dataFile}; getData()`);
    const matchingIdx = data.findIndex((d) => d.name === currentBranch);
    if (matchingIdx >= 0) {
        data.splice(matchingIdx, 1, { name: currentBranch, results });
    } else {
        data.push({ name: currentBranch, results });
    }

    const updatedDataFile = `export function getData() {\nreturn ${JSON.stringify(data)};\n}\n`;

    console.info(`Updating ${summaryExampleDataFile}...`);
    const prettierOpts = { filepath: summaryExampleDataFile, tabWidth: 4, singleQuote: true };
    prettier.format(updatedDataFile, prettierOpts).then((formatted) => {
        fs.writeFileSync(summaryExampleDataFile, formatted);
    });
}

updateSummaryExample(readReports());
