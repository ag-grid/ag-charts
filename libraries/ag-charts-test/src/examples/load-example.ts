/* eslint-disable @typescript-eslint/no-implied-eval */

/* eslint-disable no-console */
import * as fs from 'fs';

const filters = [
    /AgCharts\.(create|update)/,
    /setInterval|setTimeout/,
    /container:/,
    /^Object\.defineProperty/,
    /^const (ag_charts_(community|enterprise)|data)_1 =/,
    /agChartsDebug =/,
];

function cleanJs(content: string) {
    const filteredLines = content.split('\n').filter((line) => !filters.some((f) => f.test(line)));

    const optionsEnd = filteredLines.findIndex((l) => l.includes('@ag-options-end'));
    if (optionsEnd >= 0) {
        filteredLines.splice(optionsEnd);
    }

    return filteredLines.join('\n');
}

export function loadExampleOptions(
    agCharts: { AgCharts: {}; time: {}; Marker: {} },
    name: string,
    evalReturn = 'options',
    exampleRootDir = `${process.cwd()}/dist/packages/ag-charts-community-examples/src/`,
    dataFile = `${exampleRootDir}charts-overview/examples/${name}/data.js`,
    exampleFile = `${exampleRootDir}charts-overview/examples/${name}/main.js`
): any {
    const { AgCharts, time, Marker } = agCharts;
    const evalContent = [cleanJs(fs.readFileSync(exampleFile, 'utf8')), `return ${evalReturn};`].join('\n');
    const evalExpr = fs.existsSync(dataFile) ? `const data_1 = require('${dataFile}');\n${evalContent}` : evalContent;

    try {
        const exampleRunFn = Function('ag_charts_community_1', 'AgCharts', 'time', 'Marker', 'require', evalExpr);
        return exampleRunFn(agCharts, AgCharts, time, Marker, require);
    } catch (error: any) {
        console.group();
        console.error(`unable to read example data for [${name}]; error: ${error.message}`);
        console.log(evalExpr);
        console.groupEnd();
        return [];
    }
}

export function parseExampleOptions(
    evalFn: string,
    exampleJs: string,
    dataJs: string = '',
    evalGlobals: Record<string, unknown> = {}
) {
    const evalExpr = [dataJs, cleanJs(exampleJs), `return ${evalFn};`].join('\n');
    const exampleRunFn = Function(...Object.keys(evalGlobals), evalExpr);
    return exampleRunFn(...Object.values(evalGlobals));
}

export function loadBuiltExampleOptions(name: string) {
    const fileContent = fs
        .readFileSync(
            `dist/generated-examples/ag-charts-website/docs/benchmarks/_examples/${name}/plain/vanilla/contents.json`
        )
        .toString();
    return JSON.parse(JSON.parse(fileContent)['files']['_options.json'])['myChart'];
}
