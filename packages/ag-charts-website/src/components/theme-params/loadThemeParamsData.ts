import { _ModuleSupport, _Theme } from 'ag-charts-community';
import type { AgChartOptions, AgChartThemeName } from 'ag-charts-community';
import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import { type ThemeParamsGraph, buildThemeParamsGraph } from './themeParamsGraph';

ModuleRegistry.registerModules([AllEnterpriseModule]);

export const STOCK_THEMES: AgChartThemeName[] = [
    'ag-default',
    'ag-default-dark',
    'ag-sheets',
    'ag-sheets-dark',
    'ag-polychroma',
    'ag-polychroma-dark',
    'ag-vivid',
    'ag-vivid-dark',
    'ag-material',
    'ag-material-dark',
    'ag-financial',
    'ag-financial-dark',
];

export function loadThemeParamsGraph(): ThemeParamsGraph {
    const defaults = _Theme.ChartTheme.getDefaultPublicParameters() as Record<string, unknown>;
    const templates = _Theme.themes['ag-default']!().config as Record<string, unknown>;
    return buildThemeParamsGraph(defaults, templates);
}

/** A stock theme's params with every reference and blend resolved, exactly as a chart would see them. */
export function resolveThemeParams(theme: AgChartThemeName): Record<string, unknown> {
    const options: AgChartOptions = { theme, data: [], series: [{ type: 'line', xKey: 'x', yKey: 'y' }] };
    const chartOptions = new _ModuleSupport.ChartOptions(undefined, options, {}, {}, {});
    return chartOptions.themeParameters as Record<string, unknown>;
}
