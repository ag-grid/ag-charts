import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
export declare class MaterialLight extends ChartTheme {
    protected static getDefaultColors(): {
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
