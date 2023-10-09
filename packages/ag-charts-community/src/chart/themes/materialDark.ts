import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const MATERIAL_DARK_FILLS = {
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

const MATERIAL_DARK_STROKES = {
    BLUE: '#4ed2ff',
    CYAN: '#52e5fe',
    DARK_CYAN: '#47bdae',
    GREEN: '#75d877',
    RED: '#ff705e',
    PINK: '#ff5588',
    MAGENTA: '#c554d9',
    VIOLET: '#8a62e1',
    DARK_BLUE: '#6077df',
    VIVID_BLUE: '#53beff',
};

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(MATERIAL_DARK_FILLS)),
    strokes: Array.from(Object.values(MATERIAL_DARK_STROKES)),
};

export class MaterialDark extends DarkTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: MATERIAL_DARK_FILLS.BLUE,
            stroke: MATERIAL_DARK_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: MATERIAL_DARK_FILLS.RED,
            stroke: MATERIAL_DARK_STROKES.RED,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: MATERIAL_DARK_FILLS.DARK_CYAN,
            stroke: MATERIAL_DARK_STROKES.DARK_CYAN,
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            MaterialDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            MaterialDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            MaterialDark.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            MaterialDark.getWaterfallSeriesDefaultTotalColors().stroke
        );
        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, [MATERIAL_DARK_FILLS.BLUE, MATERIAL_DARK_FILLS.RED]);

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
