import * as fs from 'fs';

import { Logger } from '../../util/logger';

export const filters = [
    /.*AgChart\.(update|create)/,
    /.*AgEnterpriseCharts\.(update|create)/,
    /.* container: .*/,
    /.*setInterval.*/,
    /.*setTimeout.*/,
    /^Object\.defineProperty/,
    /^exports\./,
    /^const data_1 =/,
];

const cleanJs = (content: string) =>
    content
        .split('\n')
        .filter((line) => !filters.some((f) => f.test(line)))
        .join('\n');

export function loadExampleOptions(
    name: string,
    evalReturn = 'options',
    exampleRootDir = `${process.cwd()}/dist/packages/ag-charts-community-examples/src/`,
    dataFile = `${exampleRootDir}charts-overview/examples/${name}/data.js`,
    exampleFile = `${exampleRootDir}charts-overview/examples/${name}/main.js`
): any {
    const evalContent = [cleanJs(fs.readFileSync(exampleFile, 'utf8')), `return ${evalReturn};`].join('\n');
    const evalExpr = fs.existsSync(dataFile)
        ? [`with (data_1 = require('${dataFile}')) {`, evalContent, '}'].join('\n')
        : evalContent;
    try {
        const exampleRunFn = new Function('require', evalExpr);
        return exampleRunFn(require);
    } catch (error: any) {
        Logger.error(`unable to read example data for [${name}]; error: ${error.message}`);
        Logger.log(evalExpr);
        return [];
    }
}

export function parseExampleOptions(
    evalFn: string,
    exampleJs: string,
    dataJs?: string,
    evalGlobals: Record<string, unknown> = {}
) {
    const evalExpr = [dataJs ?? '', cleanJs(exampleJs), `return ${evalFn};`].join('\n');
    const exampleRunFn = new Function(...Object.keys(evalGlobals), evalExpr);
    return exampleRunFn(...Object.values(evalGlobals));
}
