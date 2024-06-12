import type { AgChartThemePalette } from 'ag-charts-types';

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

const SHEETS_DARK_FILLS = {
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

const SHEETS_DARK_STROKES = {
    BLUE: '#6899ee',
    ORANGE: '#ffa55d',
    GRAY: '#cdcdcd',
    YELLOW: '#ffea53',
    MODERATE_BLUE: '#82c3ff',
    GREEN: '#96d56f',
    DARK_GRAY: '#a1a1a1',
    DARK_BLUE: '#47689f',
    VERY_DARK_GRAY: '#878787',
    DARK_YELLOW: '#c0993d',
};

const palette: AgChartThemePalette = {
    fills: Object.values(SHEETS_DARK_FILLS),
    strokes: Object.values(SHEETS_DARK_STROKES),
};

export class SheetsDark extends DarkTheme {
    protected static override getDefaultColors() {
        return {
            fills: { ...SHEETS_DARK_FILLS, RED: SHEETS_DARK_FILLS.ORANGE },
            strokes: { ...SHEETS_DARK_STROKES, RED: SHEETS_DARK_STROKES.ORANGE },
        };
    }

    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: SHEETS_DARK_FILLS.BLUE,
            stroke: SHEETS_DARK_STROKES.BLUE,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: SHEETS_DARK_FILLS.ORANGE,
            stroke: SHEETS_DARK_STROKES.ORANGE,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: SHEETS_DARK_FILLS.GRAY,
            stroke: SHEETS_DARK_STROKES.GRAY,
            label: {
                color: 'white',
            },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_COLOURS, SheetsDark.getDefaultColors());
        params.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, SheetsDark.getWaterfallSeriesDefaultPositiveColors());
        params.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, SheetsDark.getWaterfallSeriesDefaultNegativeColors());
        params.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, SheetsDark.getWaterfallSeriesDefaultTotalColors());

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            SHEETS_DARK_FILLS.ORANGE,
            SHEETS_DARK_FILLS.YELLOW,
            SHEETS_DARK_FILLS.GREEN,
        ]);

        params.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            SheetsDark.getWaterfallSeriesDefaultTotalColors().stroke
        );

        params.set(DEFAULT_ANNOTATION_STROKE, SHEETS_DARK_STROKES.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, SHEETS_DARK_FILLS.BLUE);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
