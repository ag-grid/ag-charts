import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_COLOURS,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
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
    fills: Object.values(MATERIAL_DARK_FILLS),
    strokes: Object.values(MATERIAL_DARK_STROKES),
};

export class MaterialDark extends DarkTheme {
    protected static override getDefaultColors() {
        return {
            fills: MATERIAL_DARK_FILLS,
            strokes: MATERIAL_DARK_STROKES,
        };
    }

    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: MATERIAL_DARK_FILLS.BLUE,
            stroke: MATERIAL_DARK_STROKES.BLUE,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: MATERIAL_DARK_FILLS.RED,
            stroke: MATERIAL_DARK_STROKES.RED,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: MATERIAL_DARK_FILLS.GRAY,
            stroke: MATERIAL_DARK_STROKES.GRAY,
            label: {
                color: 'white',
            },
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(DEFAULT_COLOURS, MaterialDark.getDefaultColors());
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

        result.properties.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            MATERIAL_DARK_FILLS.ORANGE,
            MATERIAL_DARK_FILLS.YELLOW,
            MATERIAL_DARK_FILLS.GREEN,
        ]);

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            MaterialDark.getWaterfallSeriesDefaultTotalColors().stroke
        );

        result.properties.set(DEFAULT_ANNOTATION_STROKE, MATERIAL_DARK_STROKES.BLUE);
        result.properties.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, MATERIAL_DARK_FILLS.BLUE);

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
