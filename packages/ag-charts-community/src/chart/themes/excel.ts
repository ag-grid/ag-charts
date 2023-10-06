import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const EXCEL_LIGHT_FILLS = {
    BLUE: '#4472C4',
    ORANGE: '#ED7D31',
    GRAY: '#A5A5A5',
    YELLOW: '#FFC000',
    MODERATE_BLUE: '#5B9BD5',
    GREEN: '#70AD47',
    DARK_GRAY: '#7B7B7B',
    DARK_BLUE: '#264478',
    VERY_DARK_GRAY: '#636363',
    DARK_YELLOW: '#997300',
};

const EXCEL_LIGHT_STROKES = {
    BLUE: '#214d9b',
    ORANGE: '#c25600',
    GRAY: '#7f7f7f',
    YELLOW: '#d59800',
    MODERATE_BLUE: '#3575ac',
    GREEN: '#4b861a',
    DARK_GRAY: '#575757',
    DARK_BLUE: '#062253',
    VERY_DARK_GRAY: '#414141',
    DARK_YELLOW: '#734f00',
};

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(EXCEL_LIGHT_FILLS)),
    strokes: Array.from(Object.values(EXCEL_LIGHT_STROKES)),
};

export class Excel extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: EXCEL_LIGHT_FILLS.BLUE,
            stroke: EXCEL_LIGHT_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: EXCEL_LIGHT_FILLS.ORANGE,
            stroke: EXCEL_LIGHT_STROKES.ORANGE,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: EXCEL_LIGHT_FILLS.GRAY,
            stroke: EXCEL_LIGHT_STROKES.GRAY,
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            Excel.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            Excel.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, Excel.getWaterfallSeriesDefaultTotalColors());

        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, [EXCEL_LIGHT_FILLS.BLUE, EXCEL_LIGHT_FILLS.ORANGE]);

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
