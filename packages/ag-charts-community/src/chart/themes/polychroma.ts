import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const POLYCHROMA_FILLS = {
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

const POLYCHROMA_STROKES = {
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

const palette: AgChartThemePalette = {
    fills: Array.from(Object.values(POLYCHROMA_FILLS)),
    strokes: Array.from(Object.values(POLYCHROMA_STROKES)),
};

export class Polychroma extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: POLYCHROMA_FILLS.BLUE,
            stroke: POLYCHROMA_STROKES.BLUE,
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: POLYCHROMA_FILLS.RED,
            stroke: POLYCHROMA_STROKES.RED,
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: POLYCHROMA_FILLS.YELLOW,
            stroke: POLYCHROMA_STROKES.YELLOW,
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            Polychroma.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            Polychroma.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            Polychroma.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, [POLYCHROMA_FILLS.BLUE, POLYCHROMA_FILLS.RED]);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
