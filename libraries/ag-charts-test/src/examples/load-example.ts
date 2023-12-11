/* eslint-disable no-console */
import * as fs from 'fs';

const filters = [
    /AgCharts\.(create|update)/,
    /setInterval|setTimeout/,
    /container:/,
    /^Object\.defineProperty/,
    /^const (ag_charts_(community|enterprise)|data)_1 =/,
];

const cleanJs = (content: string) =>
    content
        .split('\n')
        .filter((line) => !filters.some((f) => f.test(line)))
        .join('\n');

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
