import type { AgChartThemeOptions, AgChartThemePalette } from 'ag-charts-types';
import { ChartTheme } from './chartTheme';
import type { DefaultColors } from './defaultColors';
export declare class DarkTheme extends ChartTheme {
    getDefaultColors(): DefaultColors;
    getTemplateParameters(): Map<any, any>;
    protected getPalette(): AgChartThemePalette;
    constructor(options?: AgChartThemeOptions);
}
