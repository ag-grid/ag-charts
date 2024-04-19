import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_COLOURS,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const POLYCHROMA_LIGHT_FILLS = {
    BLUE: '#436ff4',
    PURPLE: '#9a7bff',
    MAGENTA: '#d165d2',
    PINK: '#f0598b',
    RED: '#f47348',
    ORANGE: '#f2a602',
    YELLOW: '#e9e201',
    GREEN: '#21b448',
    CYAN: '#00b9a2',
    MODERATE_BLUE: '#00aee4',
};

const POLYCHROMA_LIGHT_STROKES = {
    BLUE: '#2346c9',
    PURPLE: '#7653d4',
    MAGENTA: '#a73da9',
    PINK: '#c32d66',
    RED: '#c84b1c',
    ORANGE: '#c87f00',
    YELLOW: '#c1b900',
    GREEN: '#008c1c',
    CYAN: '#00927c',
    MODERATE_BLUE: '#0087bb',
};

const POLYCHROMA_LIGHT_FILL_GRAY = '#bbbbbb';
const POLYCHROMA_LIGHT_STROKE_GRAY = '#888888';

const palette: AgChartThemePalette = {
    fills: Object.values(POLYCHROMA_LIGHT_FILLS),
    strokes: Object.values(POLYCHROMA_LIGHT_STROKES),
};

export class PolychromaLight extends ChartTheme {
    protected static override getDefaultColors() {
        return {
            fills: POLYCHROMA_LIGHT_FILLS,
            strokes: POLYCHROMA_LIGHT_STROKES,
        };
    }
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: POLYCHROMA_LIGHT_FILLS.BLUE,
            stroke: POLYCHROMA_LIGHT_STROKES.BLUE,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: POLYCHROMA_LIGHT_FILLS.RED,
            stroke: POLYCHROMA_LIGHT_STROKES.RED,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: POLYCHROMA_LIGHT_FILL_GRAY,
            stroke: POLYCHROMA_LIGHT_STROKE_GRAY,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(DEFAULT_COLOURS, PolychromaLight.getDefaultColors());
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            PolychromaLight.getWaterfallSeriesDefaultPositiveColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            PolychromaLight.getWaterfallSeriesDefaultNegativeColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            PolychromaLight.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            POLYCHROMA_LIGHT_FILLS.BLUE,
            POLYCHROMA_LIGHT_FILLS.RED,
        ]);

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            PolychromaLight.getWaterfallSeriesDefaultTotalColors().stroke
        );

        result.properties.set(DEFAULT_ANNOTATION_STROKE, POLYCHROMA_LIGHT_STROKES.BLUE);
        result.properties.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, POLYCHROMA_LIGHT_FILLS.BLUE);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
