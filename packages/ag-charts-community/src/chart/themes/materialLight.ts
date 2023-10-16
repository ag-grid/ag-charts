import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const MATERIAL_LIGHT_FILLS = {
    BLUE: '#03a9f4',
    CYAN: '#00bcd4',
    DARK_CYAN: '#009688',
    GREEN: '#4caf50',
    RED: '#f44336',
    PINK: '#e91e63',
    MAGENTA: '#9c27b0',
    VIOLET: '#673ab7',
    DARK_BLUE: '#3f51b5',
    VIVID_BLUE: '#2196f3',
};

const MATERIAL_LIGHT_STROKES = {
    BLUE: '#0081ca',
    CYAN: '#0094ac',
    DARK_CYAN: '#007064',
    GREEN: '#1d8828',
    RED: '#c60000',
    PINK: '#bb0040',
    MAGENTA: '#740088',
    VIOLET: '#47078e',
    DARK_BLUE: '#222b8c',
    VIVID_BLUE: '#006fc8',
};

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(MATERIAL_LIGHT_FILLS)),
    strokes: Array.from(Object.values(MATERIAL_LIGHT_STROKES)),
};

export class MaterialLight extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: MATERIAL_LIGHT_FILLS.BLUE,
            stroke: MATERIAL_LIGHT_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: MATERIAL_LIGHT_FILLS.RED,
            stroke: MATERIAL_LIGHT_STROKES.RED,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: MATERIAL_LIGHT_FILLS.DARK_CYAN,
            stroke: MATERIAL_LIGHT_STROKES.DARK_CYAN,
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultPositiveColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultNegativeColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            MaterialLight.getWaterfallSeriesDefaultTotalColors().stroke
        );
        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, [
            MATERIAL_LIGHT_FILLS.BLUE,
            MATERIAL_LIGHT_FILLS.RED,
        ]);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
