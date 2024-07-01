import type { AgChartThemePalette } from 'ag-charts-types';
import { DarkTheme } from './darkTheme';
export declare class MaterialDark extends DarkTheme {
    getDefaultColors(): {
        fills: {
            BLUE: string;
            ORANGE: string;
            GREEN: string;
            CYAN: string;
            YELLOW: string;
            VIOLET: string;
            GRAY: string;
            MAGENTA: string;
            BROWN: string;
            RED: string;
        };
        strokes: {
            BLUE: string;
            ORANGE: string;
            GREEN: string;
            CYAN: string;
            YELLOW: string;
            VIOLET: string;
            GRAY: string;
            MAGENTA: string;
            BROWN: string;
            RED: string;
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
