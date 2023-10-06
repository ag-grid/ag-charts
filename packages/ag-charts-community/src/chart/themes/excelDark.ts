import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
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
        '#6899ee',
        '#ffa55d',
        '#cdcdcd',
        '#ffea53',
        '#82c3ff',
        '#96d56f',
        '#a1a1a1',
        '#47689f',
        '#878787',
        '#c0993d',
    ],
};

export class ExcelDark extends DarkTheme {
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
            ExcelDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            ExcelDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, ExcelDark.getWaterfallSeriesDefaultTotalColors());

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
