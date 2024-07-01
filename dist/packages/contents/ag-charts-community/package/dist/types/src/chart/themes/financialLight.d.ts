import type { AgChartThemePalette } from 'ag-charts-types';
import { ChartTheme } from './chartTheme';
export declare class FinancialLight extends ChartTheme {
    getDefaultColors(): {
        fills: {
            GREEN: string;
            RED: string;
            BLUE: string;
        };
        strokes: {
            GREEN: string;
            RED: string;
            BLUE: string;
        };
        up: {
            fill: string;
            stroke: string;
        };
        down: {
            fill: string;
            stroke: string;
        };
        neutral: {
            fill: string;
            stroke: string;
        };
    };
    getTemplateParameters(): Map<any, any>;
    protected getPalette(): AgChartThemePalette;
}