// eslint-disable-next-line @nx/enforce-module-boundaries
import { cleanJs } from '../../../ag-charts-community/src/chart/test/load-example';
import * as agCharts from '../main';

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
