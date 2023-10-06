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
        '#3f8fea',
        '#ff9900',
        '#2ea049',
        '#00c2eb',
        '#e4cc00',
        '#9a63d6',
        '#888888',
        '#c550ac',
        '#925f00',
        '#f94548',
    ],
    strokes: [
        '#0f68c0',
        '#d47100',
        '#007922',
        '#009ac2',
        '#bca400',
        '#753cac',
        '#646464',
        '#9b2685',
        '#6c3b00',
        '#cb0021',
    ],
};

export class VividLight extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: '#3f8fea',
            stroke: '#67b7ff',
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: '#ff9900',
            stroke: '#ffc24d',
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: '#888888',
            stroke: '#aeaeae',
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            VividLight.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            VividLight.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            VividLight.getWaterfallSeriesDefaultTotalColors()
        );

        result.properties.set(DEFAULT_HEATMAP_SERIES_COLOUR_RANGE, ['#3f8fea', '#ff9900']);

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
