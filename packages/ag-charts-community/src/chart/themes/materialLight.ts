import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const palette: AgChartThemePalette = {
    fills: [
        '#03a9f4',
        '#00bcd4',
        '#009688',
        '#4caf50',
        '#f44336',
        '#e91e63',
        '#9c27b0',
        '#673ab7',
        '#3f51b5',
        '#2196f3',
    ],
    strokes: [
        '#0081ca',
        '#0094ac',
        '#007064',
        '#1d8828',
        '#c60000',
        '#bb0040',
        '#740088',
        '#47078e',
        '#222b8c',
        '#006fc8',
    ],
};

export class MaterialLight extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: '#03a9f4',
            stroke: '#0081ca',
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: '#f44336',
            stroke: '#c60000',
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: '#009688',
            stroke: '#47bdae',
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            MaterialLight.getWaterfallSeriesDefaultTotalColors()
        );

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
