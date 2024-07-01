import type { AgChartThemePalette } from 'ag-charts-types';
import { ChartTheme } from './chartTheme';
export declare class PolychromaLight extends ChartTheme {
    getDefaultColors(): {
        fills: {
            BLUE: string;
            PURPLE: string;
            MAGENTA: string;
            PINK: string;
            RED: string;
            ORANGE: string;
            YELLOW: string;
            GREEN: string;
            CYAN: string;
            MODERATE_BLUE: string;
        };
        strokes: {
            BLUE: string;
            PURPLE: string;
            MAGENTA: string;
            PINK: string;
            RED: string;
            ORANGE: string;
            YELLOW: string;
            GREEN: string;
            CYAN: string;
            MODERATE_BLUE: string;
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
