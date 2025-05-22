#!node

const fs = require('fs');
const glob = require('glob');
const path = require('path');
const child_process = require('child_process');
const prettier = require('prettier');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const currentBranchName = () => child_process.execSync(`git branch --show-current`).toString().split('\n')[0];
const summaryExampleDataFile = 'packages/ag-charts-website/src/content/docs/benchmarks/_examples/summary/data.ts';

const argv = yargs(hideBin(process.argv))
    .option('name', {
        alias: 'n',
        type: 'string',
        default: currentBranchName,
        description: 'Name of entry to update in data.ts.',
    })
    .option('data-file', {
        alias: 'f',
        type: 'string',
        default: summaryExampleDataFile,
        description: 'data.ts file to update.',
    })
    .option('reports-path', {
        alias: 'p',
        type: 'string',
        default: '',
        description: 'Path to reports/ directory.',
    })
    .help()
    .parse();

function readReports() {
    const rootDir = path.resolve(process.cwd(), path.join(argv['reports-path'], 'reports'));

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

function updateSummaryExample(results) {
    console.info(`Reading ${argv['data-file']}...`);

    let data = [];
    if (fs.existsSync(argv['data-file'])) {
        let dataFile = fs.readFileSync(argv['data-file']).toString();
        dataFile = dataFile.replace('export function', 'function');

        data = eval(`${dataFile}; getData()`);
    }

    const matchingIdx = data.findIndex((d) => d.name === argv['name']);
    if (matchingIdx >= 0) {
        data.splice(matchingIdx, 1, { name: argv['name'], results });
    } else {
        data.push({ name: argv['name'], results });
    }

    const updatedDataFile = `export function getData() {\nreturn ${JSON.stringify(data)};\n}\n`;

    console.info(`Updating ${argv['data-file']}...`);
    const prettierOpts = { filepath: argv['data-file'], tabWidth: 4, singleQuote: true, printWidth: 100 };
    prettier.format(updatedDataFile, prettierOpts).then((formatted) => {
        fs.writeFileSync(argv['data-file'], formatted);
    });
}

updateSummaryExample(readReports());
