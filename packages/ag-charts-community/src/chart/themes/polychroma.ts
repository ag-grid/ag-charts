import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_HEATMAP_SERIES_COLOUR_RANGE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const palette: AgChartThemePalette = {
    fills: [
        '#436ff4',
        '#9a7bff',
        '#d165d2',
        '#f0598b',
        '#f47348',
        '#f2a602',
        '#e9e201',
        '#21b448',
        '#00b9a2',
        '#00aee4',
    ],
    strokes: [
        '#2346c9',
        '#7653d4',
        '#a73da9',
        '#c32d66',
        '#c84b1c',
        '#c87f00',
        '#c1b900',
        '#008c1c',
        '#00927c',
        '#0087bb',
    ],
};

export class Polychroma extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: '#436ff4',
            stroke: '#2346c9',
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: '#f47348',
            stroke: '#c84b1c',
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: '#e9e201',
            stroke: '#c1b900',
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

        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, ['#436ff4', '#f47348']);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
