import * as agCharts from '../main';

const filters = [
    /.*AgChart\.(update|create)/,
    /.*AgEnterpriseCharts\.(update|create)/,
    /.* container: .*/,
    /.*setInterval.*/,
    /.*setTimeout.*/,
    /^Object\.defineProperty/,
    /^exports\./,
    /^const ag_charts_community_1 =/,
    /^const ag_charts_enterprise_1 =/,
    /^const data_1 =/,
];

const cleanJs = (content: Buffer | string) => {
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

export function parseExampleOptions(evalFn: string, exampleJs: string, dataJs?: string) {
    const evalExpr = [dataJs ? dataJs : '', ...cleanJs(exampleJs), `return ${evalFn};`].join('\n');
    // @ts-ignore - used in the eval() call.
    const { AgChart, time, Marker } = agCharts;

    const exampleRunFn = new Function(
        'ag_charts_community_1',
        'agChartsEnterprise',
        'AgChart',
        'time',
        'Marker',
        evalExpr
    );
    return exampleRunFn(agCharts, agCharts, AgChart, time, Marker);
}
