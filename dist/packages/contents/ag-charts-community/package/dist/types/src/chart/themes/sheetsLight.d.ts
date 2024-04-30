import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
export declare class SheetsLight extends ChartTheme {
    protected static getDefaultColors(): {
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
    };
    protected static getWaterfallSeriesDefaultPositiveColors(): {
        fill: string;
        stroke: string;
        label: {
            color: string;
        };
    };
    protected static getWaterfallSeriesDefaultNegativeColors(): {
        fill: string;
        stroke: string;
        label: {
            color: string;
        };
    };
    protected static getWaterfallSeriesDefaultTotalColors(): {
        fill: string;
        stroke: string;
        label: {
            color: string;
        };
    };
    getTemplateParameters(): {
        extensions: Map<any, any>;
        properties: Map<any, any>;
    };
    protected getPalette(): AgChartThemePalette;
}
