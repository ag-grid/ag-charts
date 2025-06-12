import type { Operation } from 'ag-charts-types';

import { themes } from './chart/mapping/themes';
import { ChartTheme } from './chart/themes/chartTheme';
import { OptionsGraph } from './module/optionsGraph';

// Only these imports are used by ag-grid.
// DO NOT ADD EXPORTS UNLESS REQUIRED BY INTEGRATED CHARTS.
export { getChartTheme } from './chart/mapping/themes';
export * as themeSymbols from './chart/themes/symbols';
export const themeNames = Object.keys(themes);

// TODO remove once ag-grid codebase has been updated
export { ChartTheme } from './chart/themes/chartTheme';
export { themes } from './chart/mapping/themes';
export * from './chart/themes/symbols';

export function resolveOperation(operation: Operation): any {
    // Use the default theme params and palette, ignoring the grid's chosen theme
    const params = ChartTheme.getDefaultPublicParameters();
    const palette = ChartTheme.getDefaultColors();

    // Create a graph with a stub line series with which to resolve the operation
    const graph = new OptionsGraph({ line: { operation } }, { series: [{ type: 'line' }] }, params, palette);
    const resolved = graph.resolve();

    return resolved.operation;
}
