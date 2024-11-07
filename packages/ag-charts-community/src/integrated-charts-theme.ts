import { themes } from './chart/mapping/themes';

// Only these imports are used by ag-grid.
// DO NOT ADD EXPORTS UNLESS REQUIRED BY INTEGRATED CHARTS.
export { getChartTheme } from './chart/mapping/themes';
export * as themeSymbols from './chart/themes/symbols';
export const themeNames = Object.keys(themes);

// TODO remove once ag-grid codebase has been updated
export { ChartTheme } from './chart/themes/chartTheme';
export { themes } from './chart/mapping/themes';
export * from './chart/themes/symbols';
