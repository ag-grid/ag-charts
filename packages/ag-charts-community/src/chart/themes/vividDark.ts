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

const VIVID_DARK_FILLS = {
    BLUE: '#0083ff',
    ORANGE: '#ff6600',
    GREEN: '#00af00',
    CYAN: '#00ccff',
    YELLOW: '#f7c700',
    VIOLET: '#ac26ff',
    GRAY: '#a7a7b7',
    MAGENTA: '#e800c5',
    BROWN: '#b54300',
    RED: '#ff0000',
};

const VIVID_DARK_STROKES = {
    BLUE: '#67b7ff',
    ORANGE: '#ffc24d',
    GREEN: '#5cc86f',
    CYAN: '#54ebff',
    VIOLET: '#c18aff',
    YELLOW: '#fff653',
    GRAY: '#aeaeae',
    MAGENTA: '#f078d4',
    BROWN: '#ba8438',
    RED: '#ff726e',
};

const palette: AgChartThemePalette = {
    fills: Object.values(VIVID_DARK_FILLS),
    strokes: Object.values(VIVID_DARK_STROKES),
};

export class VividDark extends DarkTheme {
    protected static override getDefaultColors() {
        return {
            fills: VIVID_DARK_FILLS,
            strokes: VIVID_DARK_STROKES,
        };
    }

    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: VIVID_DARK_FILLS.BLUE,
            stroke: VIVID_DARK_STROKES.BLUE,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: VIVID_DARK_FILLS.ORANGE,
            stroke: VIVID_DARK_STROKES.ORANGE,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: VIVID_DARK_FILLS.GRAY,
            stroke: VIVID_DARK_STROKES.GRAY,
            label: {
                color: 'white',
            },
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(DEFAULT_COLOURS, VividDark.getDefaultColors());
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            VividDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            VividDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.properties.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, VividDark.getWaterfallSeriesDefaultTotalColors());

        result.properties.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            VIVID_DARK_FILLS.ORANGE,
            VIVID_DARK_FILLS.YELLOW,
            VIVID_DARK_FILLS.GREEN,
        ]);

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            VividDark.getWaterfallSeriesDefaultTotalColors().stroke
        );

        result.properties.set(DEFAULT_ANNOTATION_STROKE, VIVID_DARK_STROKES.BLUE);
        result.properties.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, VIVID_DARK_FILLS.BLUE);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
