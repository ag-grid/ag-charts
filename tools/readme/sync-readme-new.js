// Framework Code Snippets
const {
    financialChartsAngular,
    financialChartsReact,
    financialChartsVue3,
    quickStartReact,
    quickStartAngular,
    quickStartVue3,
} = require('./readme-framework-content');

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const prettier = require('prettier');
const packageReadmeList = glob.sync('packages/*/README.md');
const rootReadme = fs.readFileSync('./README.md').toString();
const libraries = ['ag-charts-community', 'ag-charts-enterprise', 'ag-charts-types', 'ag-charts-locale'];

function titleCase(name) {
    return `${name.substring(0, 1).toLocaleUpperCase()}${name.substring(1)}`;
}

const updateContent = (readme) => {
    const packageName = path.dirname(readme).split('/').at(-1);
    const isLibrary = libraries.includes(packageName);
    const framework = isLibrary ? 'javascript' : packageName.split('-').at(-1).replace('vue3', 'vue');
    const packageTitle = packageName
        .replaceAll('-', ' ')
        .replaceAll('ag charts', '')
        .split(' ')
        .map((s) => titleCase(s))
        .join(' ');

    // Update Content
    let newReadme = rootReadme
        .replaceAll('https://charts.ag-grid.com/javascript/', `https://charts.ag-grid.com/${framework}/`)
        .replaceAll('/ag-charts-community', `/${packageName}`)
        .replaceAll('JavaScript', `${packageTitle}`)
        .replaceAll('$ npm install ag-charts-community', `$ npm install ${packageName}`)
        .replaceAll(
            'Read on for vanilla JavaScript installation instructions, or refer to our framework-specific guides for <strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-react"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/react.svg?raw=true" height="16" width="16" alt="React Logo"> React</a></strong>, <strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-angular"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/angular.svg?raw=true" height="16" width="16" alt="Angular Logo"> Angular</a></strong> and <strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-vue3"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/vue.svg?raw=true" height="16" width="16" alt="Vue Logo"> Vue</a></strong>.',
            ''
        );

    // Update Main Description
    newReadme = updateMainDescription(newReadme, packageTitle);

    // Update Finance Charts Snippet
    newReadme = updateFinancialChartsCodeSnippet(newReadme, packageTitle);

    // Update Quick Start Desc
    newReadme = updateQuickStartDescription(newReadme, packageTitle);

    // Update Setup for Frameworks
    newReadme = updateSetup(newReadme, packageTitle);

    return newReadme;
};

const updateMainDescription = (content, packageTitle) => {
    const newContent = `\t<p>AG Charts is a <strong>fully-featured</strong> and <strong>highly customizable</strong> canvas-based ${packageTitle} Charting library. It delivers <strong>outstanding performance</strong> and has <strong>no third-party dependencies</strong>.</p>\t`;

    // Define the start and end markers
    const startMarker = '<!-- START MAIN DESCRIPTION -->';
    const endMarker = '<!-- END MAIN DESCRIPTION -->';

    // Construct the new content to be inserted
    const newSection = `${startMarker}\n${newContent}\n${endMarker}`;

    // Use regular expressions to find and replace the content between the markers
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
    return content.replace(regex, newSection);
};

// Replaces code snippet for financial charts w/ Framework specific (React / Angular / Vue) code snippet, if applicable
const updateFinancialChartsCodeSnippet = (content, packageTitle) => {
    let newContent;
    const normalizedTitle = packageTitle.trim().toLowerCase();
    switch (normalizedTitle) {
        case 'react':
            newContent = financialChartsReact;
            break;
        case 'angular':
            newContent = financialChartsAngular;
            break;
        case 'vue3':
            newContent = financialChartsVue3;
            break;
        default:
            return content;
    }

    // Define the start and end markers
    const startMarker = '<!-- START FINANCIAL CHARTS CODE SNIPPET -->';
    const endMarker = '<!-- END FINANCIAL CHARTS CODE SNIPPET -->';

    // Construct the new content to be inserted
    const newSection = `${startMarker}\n${newContent}\n${endMarker}`;

    // Use regular expressions to find and replace the content between the markers
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
    return content.replace(regex, newSection);
};

const updateQuickStartDescription = (content, packageTitle) => {
    let newContent;
    const normalizedTitle = packageTitle.trim().toLowerCase();
    switch (normalizedTitle) {
        case 'react':
        case 'angular':
        case 'vue3':
            newContent =
                'AG Charts are easy to set up - all you need to do is provide your data and series type along with any other chart options.';
            break;
        default:
            return content;
    }

    // Define the start and end markers
    const startMarker = '<!-- START QUICK START DESCRIPTION -->';
    const endMarker = '<!-- END QUICK START DESCRIPTION -->';

    // Construct the new content to be inserted
    const newSection = `${startMarker}\n${newContent}\n${endMarker}`;

    // Use regular expressions to find and replace the content between the markers
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
    return content.replace(regex, newSection);
};

const updateSetup = (content, packageTitle) => {
    let newContent;
    const normalizedTitle = packageTitle.trim().toLowerCase();
    switch (normalizedTitle) {
        case 'react':
            newContent = quickStartReact;
            break;
        case 'angular':
            newContent = quickStartAngular;
            break;
        case 'vue3':
            newContent = quickStartVue3;
            break;
        default:
            return content;
    }

    // Define the start and end markers
    const startMarker = '<!-- START SETUP -->';
    const endMarker = '<!-- END SETUP -->';

    // Construct the new content to be inserted
    const newSection = `${startMarker}\n${newContent}\n${endMarker}`;

    // Use regular expressions to find and replace the content between the markers
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
    return content.replace(regex, newSection);
};

for (const readme of packageReadmeList) {
    prettier
        .format(updateContent(readme), { filepath: './README.md', tabWidth: 4 })
        .then((result) => fs.writeFileSync(readme, result))
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
}
