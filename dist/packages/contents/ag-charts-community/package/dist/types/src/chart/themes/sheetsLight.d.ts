import type { AgChartThemePalette } from 'ag-charts-types';
import { ChartTheme } from './chartTheme';
export declare class SheetsLight extends ChartTheme {
    getDefaultColors(): {
        fills: {
            RED: string;
            BLUE: string;
            ORANGE: string;
            GRAY: string;
            YELLOW: string;
            MODERATE_BLUE: string;
            GREEN: string;
            DARK_GRAY: string;
            DARK_BLUE: string;
            VERY_DARK_GRAY: string;
            DARK_YELLOW: string;
        };
        strokes: {
            RED: string;
            BLUE: string;
            ORANGE: string;
            GRAY: string;
            YELLOW: string;
            MODERATE_BLUE: string;
            GREEN: string;
            DARK_GRAY: string;
            DARK_BLUE: string;
            VERY_DARK_GRAY: string;
            DARK_YELLOW: string;
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
