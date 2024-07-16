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
        .replaceAll('$ npm install ag-charts-community', `$ npm install ${packageName}`);

    // Update Main Description
    newReadme = updateMainDescription(newReadme, packageTitle);

    // Update Finance Charts Snippet
    newReadme = updateFinancialChartsCodeSnippet(newReadme, packageTitle);

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
            newContent = `\`\`\`js
const [options, setOptions] = useState({
    data: getData(),
});\n
return (
    <AgFinancialCharts options={options} />
);
\`\`\``;
            break;
        case 'angular':
            newContent = `\`\`\`js
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [AgFinancialCharts],
    template: \`<ag-financial-charts [options]="options"></ag-financial-charts>\`,
})\n
export class AppComponent {
    public options: AgFinancialChartOptions;
    constructor() {
        this.options = {
            data: getData(),
        };
    }
\`\`\``;
            break;
        case 'vue3':
            newContent = `\`\`\`js
template: \`<ag-financial-charts :options="options"/>\`,
components: {
    'ag-financial-charts': AgFinancialCharts,
},
data() {
    return {
        options: {
            data: getData(),
        },
    };
}
\`\`\``;
            break;
    }

    // Not a framework, don't update the snippet
    if (!newContent) return content;

    // Define the start and end markers
    const startMarker = '<!-- START FINANCIAL CHARTS CODE SNIPPET -->';
    const endMarker = '<!-- END FINANCIAL CHARTS CODE SNIPPET -->';

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
