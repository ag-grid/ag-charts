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

const SHEETS_LIGHT_FILLS = {
    BLUE: '#5281d5',
    ORANGE: '#ff8d44',
    GRAY: '#b5b5b5',
    YELLOW: '#ffd02f',
    MODERATE_BLUE: '#6aabe6',
    GREEN: '#7fbd57',
    DARK_GRAY: '#8a8a8a',
    DARK_BLUE: '#335287',
    VERY_DARK_GRAY: '#717171',
    DARK_YELLOW: '#a98220',
};

const SHEETS_LIGHT_STROKES = {
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
    fills: Object.values(SHEETS_LIGHT_FILLS),
    strokes: Object.values(SHEETS_LIGHT_STROKES),
};

export class SheetsLight extends ChartTheme {
    protected static override getDefaultColors() {
        return {
            fills: { ...SHEETS_LIGHT_FILLS, RED: SHEETS_LIGHT_FILLS.ORANGE },
            strokes: { ...SHEETS_LIGHT_STROKES, RED: SHEETS_LIGHT_STROKES.ORANGE },
        };
    }

    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: SHEETS_LIGHT_FILLS.BLUE,
            stroke: SHEETS_LIGHT_STROKES.BLUE,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: SHEETS_LIGHT_FILLS.ORANGE,
            stroke: SHEETS_LIGHT_STROKES.ORANGE,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: SHEETS_LIGHT_FILLS.GRAY,
            stroke: SHEETS_LIGHT_STROKES.GRAY,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_COLOURS, SheetsLight.getDefaultColors());
        params.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, SheetsLight.getWaterfallSeriesDefaultPositiveColors());
        params.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, SheetsLight.getWaterfallSeriesDefaultNegativeColors());
        params.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, SheetsLight.getWaterfallSeriesDefaultTotalColors());

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            SHEETS_LIGHT_FILLS.ORANGE,
            SHEETS_LIGHT_FILLS.YELLOW,
            SHEETS_LIGHT_FILLS.GREEN,
        ]);

        params.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            SheetsLight.getWaterfallSeriesDefaultTotalColors().stroke
        );

        params.set(DEFAULT_ANNOTATION_STROKE, SHEETS_LIGHT_STROKES.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, SHEETS_LIGHT_FILLS.BLUE);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
