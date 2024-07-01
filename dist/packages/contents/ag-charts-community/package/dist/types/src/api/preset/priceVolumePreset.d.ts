import type { AgBaseFinancialPresetOptions, AgCartesianChartOptions, AgPriceVolumePreset } from 'ag-charts-types';
import type { ChartTheme } from '../../chart/themes/chartTheme';
export declare function priceVolume(opts: AgPriceVolumePreset & AgBaseFinancialPresetOptions, getTheme: () => ChartTheme): AgCartesianChartOptions;
