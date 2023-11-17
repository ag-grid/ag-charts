import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
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
    fills: Array.from(Object.values(SHEETS_DARK_FILLS)),
    strokes: Array.from(Object.values(SHEETS_DARK_STROKES)),
};

export class SheetsDark extends DarkTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: SHEETS_DARK_FILLS.BLUE,
            stroke: SHEETS_DARK_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: SHEETS_DARK_FILLS.ORANGE,
            stroke: SHEETS_DARK_STROKES.ORANGE,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: SHEETS_DARK_FILLS.GRAY,
            stroke: SHEETS_DARK_STROKES.GRAY,
        };
    }

    override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            SheetsDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            SheetsDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.properties.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            SheetsDark.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            SheetsDark.getWaterfallSeriesDefaultTotalColors().stroke
        );

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
