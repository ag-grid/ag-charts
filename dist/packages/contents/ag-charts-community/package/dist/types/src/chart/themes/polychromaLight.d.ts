import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
export declare class PolychromaLight extends ChartTheme {
    protected static getDefaultColors(): {
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
