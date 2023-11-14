import * as fs from 'fs';

import { Logger } from '../../util/logger';

export const filters = [
    /.*AgChart\.(update|create)/,
    /.*AgChart\.(update|create)/,
    /.* container: .*/,
    /.*setInterval.*/,
    /.*setTimeout.*/,
    /^Object\.defineProperty/,
    /^exports\./,
    /^const ag_charts_community_1 =/,
    /^const ag_charts_enterprise_1 =/,
    /^const data_1 =/,
];

export const cleanJs = (content: Buffer | string) => {
    const inputLines = (typeof content === 'string' ? content : content.toString()).split('\n');
    const lines: string[] = [];

    for (let line of inputLines) {
        // Remove grossly unsupported lines.
        if (filters.some((f) => f.test(line))) continue;
        // Remove declares.
        line = line.replace(/declare var.*;/g, '');

        lines.push(line);
    }

    return lines;
};

export function loadExampleOptions(
    name: string,
    evalFn = 'options',
    exampleRootDir = `${process.cwd()}/dist/packages/ag-charts-community-examples/src/`,
    dataFile = `${exampleRootDir}charts-overview/examples/${name}/data.js`,
    exampleFile = `${exampleRootDir}charts-overview/examples/${name}/main.js`
): any {
    const dataFileExists = fs.existsSync(dataFile);
    const exampleFileLines = cleanJs(fs.readFileSync(exampleFile));

    const evalExpr = [
        dataFileExists ? `with (data_1 = require('${dataFile}')) {` : '',
        `${exampleFileLines.join('\n')}`,
        `return ${evalFn};`,
        dataFileExists ? `}` : '',
    ].join('\n');
    // @ts-ignore - used in the eval() call.
    const agCharts = require('../../main');
    // @ts-ignore - used in the eval() call.
    const { AgChart, time, Marker } = agCharts;

    try {
        const exampleRunFn = new Function('ag_charts_community_1', 'AgChart', 'time', 'Marker', 'require', evalExpr);
        return exampleRunFn(agCharts, AgChart, time, Marker, require);
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
    extraGlobals?: Record<string, any>
) {
    const evalExpr = [dataJs ?? '', ...cleanJs(exampleJs), `return ${evalFn};`].join('\n');
    // @ts-ignore - used in the eval() call.
    const agCharts = import('../../main');
    // @ts-ignore - used in the eval() call.
    const { AgChart, time, Marker } = agCharts;

    const argNames = ['ag_charts_community_1', 'AgChart', 'time', 'Marker'];
    const args = [agCharts, AgChart, time, Marker];

    for (const [name, value] of Object.entries(extraGlobals ?? {})) {
        argNames.push(name);
        args.push(value);
    }

    const exampleRunFn = new Function(...argNames, evalExpr);
    return exampleRunFn(...args);
}
