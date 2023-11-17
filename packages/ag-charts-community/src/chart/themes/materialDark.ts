import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const MATERIAL_DARK_FILLS = {
    BLUE: '#2196F3',
    ORANGE: '#FF9800',
    GREEN: '#4CAF50',
    CYAN: '#00BCD4',
    YELLOW: '#FFEB3B',
    VIOLET: '#7E57C2',
    GRAY: '#9E9E9E',
    MAGENTA: '#F06292',
    BROWN: '#795548',
    RED: '#F44336',
};

const MATERIAL_DARK_STROKES = {
    BLUE: '#90CAF9',
    ORANGE: '#FFCC80',
    GREEN: '#A5D6A7',
    CYAN: '#80DEEA',
    YELLOW: '#FFF9C4',
    VIOLET: '#B39DDB',
    GRAY: '#E0E0E0',
    MAGENTA: '#F48FB1',
    BROWN: '#A1887F',
    RED: '#EF9A9A',
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
            fill: MATERIAL_DARK_FILLS.GRAY,
            stroke: MATERIAL_DARK_STROKES.GRAY,
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            MaterialDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            MaterialDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            MaterialDark.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            MaterialDark.getWaterfallSeriesDefaultTotalColors().stroke
        );

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
