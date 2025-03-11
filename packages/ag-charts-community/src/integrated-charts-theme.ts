import type { Operation } from 'ag-charts-types';

import { themes } from './chart/mapping/themes';
import { ChartTheme } from './chart/themes/chartTheme';
import { jsonResolveOperations } from './util/json';

// Only these imports are used by ag-grid.
// DO NOT ADD EXPORTS UNLESS REQUIRED BY INTEGRATED CHARTS.
export { getChartTheme } from './chart/mapping/themes';
export * as themeSymbols from './chart/themes/symbols';
export const themeNames = Object.keys(themes);

// TODO remove once ag-grid codebase has been updated
export { ChartTheme } from './chart/themes/chartTheme';
export { themes } from './chart/mapping/themes';
export * from './chart/themes/symbols';

export function resolveOperation(operation: Operation) {
    const params = ChartTheme.getDefaultPublicParameters();
    (params as any).__palette = ChartTheme.getDefaultColors();
    const source = { operation };
    jsonResolveOperations(source, params);
    return source.operation;
}
