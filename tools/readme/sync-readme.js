const fs = require('fs');
const path = require('path');
const glob = require('glob');
const prettier = require('prettier');

const readme = fs.readFileSync('./README.md').toString();
const targets = glob.sync('packages/*/README.md');

function titleCase(name) {
    return `${name.substring(0, 1).toLocaleUpperCase()}${name.substring(1)}`;
}

function updateContent(target) {
    const packageName = path.dirname(target).split('/').at(-1);
    const packageTitle = packageName
        .replaceAll('-', ' ')
        .replaceAll('ag charts', 'AG Charts')
        .split(' ')
        .map((s) => titleCase(s))
        .join(' ');
    const isLibrary = ['ag-charts-community', 'ag-charts-enterprise'].includes(packageName);
    const framework = isLibrary ? 'javascript' : packageName.split('-').at(-1).replace('vue3', 'vue');
    const frameworkTitle = titleCase(framework);

    const updatedReadme = readme
        .replaceAll(
            '\n<!-- package stats -->\n',
            isLibrary
                ? ''
                : `| ${packageName} | [![npm](https://img.shields.io/npm/dm/${packageName}.svg)](https://www.npmjs.com/package/${packageName}) <br> [![npm](https://img.shields.io/npm/dt/${packageName}.svg)](https://www.npmjs.com/package/${packageName}) |\n`
        )
        .replaceAll('# AG Charts\n', `${packageTitle}\n`)
        .replaceAll('https://charts.ag-grid.com/javascript/', `https://charts.ag-grid.com/${framework}/`);

    if (isLibrary) {
        return updatedReadme;
    }

    const [before, during] = updatedReadme.split('<!-- START Getting started -->');
    const [_, after] = during.split('<!-- END Getting started -->');
    const gettingStartedSection = `
        Get started with [${frameworkTitle}](https://charts.ag-grid.com/${framework}/quick-start/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github).
        
        Installation for [${frameworkTitle}](https://charts.ag-grid.com/${framework}/installation/).
    `
        .trim()
        .replaceAll(/\n[\s]*/g, '\n');

    return [before, gettingStartedSection, after].join('');
}

for (const target of targets) {
    console.log(`Syncing to ${target}...`);
    prettier
        .format(updateContent(target), { filepath: './README.md', tabWidth: 2 })
        .then((result) => fs.writeFileSync(target, result))
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
}
