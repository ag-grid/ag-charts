import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const VIVID_DARK_FILLS = {
    BLUE: '#3f8fea',
    ORANGE: '#ff9900',
    GREEN: '#2ea049',
    CYAN: '#00c2eb',
    VIOLET: '#9a63d6',
    YELLOW: '#e4cc00',
    GRAY: '#888888',
    MAGENTA: '#c550ac',
    BROWN: '#925f00',
    RED: '#f94548',
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
    fills: Array.from(Object.values(VIVID_DARK_FILLS)),
    strokes: Array.from(Object.values(VIVID_DARK_STROKES)),
};

export class VividDark extends DarkTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: VIVID_DARK_FILLS.BLUE,
            stroke: VIVID_DARK_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: VIVID_DARK_FILLS.ORANGE,
            stroke: VIVID_DARK_STROKES.ORANGE,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: VIVID_DARK_FILLS.GRAY,
            stroke: VIVID_DARK_STROKES.GRAY,
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            VividDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            VividDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, VividDark.getWaterfallSeriesDefaultTotalColors());

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            VividDark.getWaterfallSeriesDefaultTotalColors().stroke
        );
        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, [VIVID_DARK_FILLS.BLUE, VIVID_DARK_FILLS.ORANGE]);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
