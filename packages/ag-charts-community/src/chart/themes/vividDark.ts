import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
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
        '#9a63d6',
        '#e4cc00',
        '#888888',
        '#c550ac',
        '#925f00',
        '#f94548',
    ],
    strokes: [
        '#67b7ff',
        '#ffc24d',
        '#5cc86f',
        '#54ebff',
        '#c18aff',
        '#fff653',
        '#aeaeae',
        '#f078d4',
        '#ba8438',
        '#ff726e',
    ],
};

export class VividDark extends DarkTheme {
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
            VividDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            VividDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, VividDark.getWaterfallSeriesDefaultTotalColors());

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
