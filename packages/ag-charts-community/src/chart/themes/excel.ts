import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const palette: AgChartThemePalette = {
    fills: [
        '#4472C4',
        '#ED7D31',
        '#A5A5A5',
        '#FFC000',
        '#5B9BD5',
        '#70AD47',
        '#7B7B7B',
        '#264478',
        '#636363',
        '#997300',
    ],
    strokes: [
        '#214d9b',
        '#c25600',
        '#7f7f7f',
        '#d59800',
        '#3575ac',
        '#4b861a',
        '#575757',
        '#062253',
        '#414141',
        '#734f00',
    ],
};

export class Excel extends ChartTheme {
    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: '#4472C4',
            stroke: '#214d9b',
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: '#ED7D31',
            stroke: '#c25600',
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: '#A5A5A5',
            stroke: '#7f7f7f',
        };
    }

    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
            Excel.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            Excel.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, Excel.getWaterfallSeriesDefaultTotalColors());

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
