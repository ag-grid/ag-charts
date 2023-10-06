import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';
import {
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
        '#6698ff',
        '#c0a3ff',
        '#fc8dfc',
        '#ff82b1',
        '#ff9b70',
        '#ffcf4e',
        '#ffff58',
        '#58dd70',
        '#51e2c9',
        '#4fd7ff',
    ],
};

export class PolychromaDark extends DarkTheme {
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
            PolychromaDark.getWaterfallSeriesDefaultPositiveColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
            PolychromaDark.getWaterfallSeriesDefaultNegativeColors()
        );
        result.extensions.set(
            DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
            PolychromaDark.getWaterfallSeriesDefaultTotalColors()
        );

        return result;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
