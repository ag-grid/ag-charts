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

const FINANCIAL_DARK_FILLS = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

const FINANCIAL_DARK_STROKES = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

const palette: AgChartThemePalette = {
    fills: Object.values(FINANCIAL_DARK_FILLS),
    strokes: Object.values(FINANCIAL_DARK_STROKES),
};

export class FinancialDark extends DarkTheme {
    protected static override getDefaultColors() {
        return {
            fills: { ...FINANCIAL_DARK_FILLS },
            strokes: { ...FINANCIAL_DARK_STROKES },
        };
    }

    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: FINANCIAL_DARK_FILLS.GREEN,
            stroke: FINANCIAL_DARK_STROKES.GREEN,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: FINANCIAL_DARK_FILLS.RED,
            stroke: FINANCIAL_DARK_STROKES.RED,
            label: {
                color: 'white',
            },
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: FINANCIAL_DARK_FILLS.BLUE,
            stroke: FINANCIAL_DARK_STROKES.BLUE,
            label: {
                color: 'white',
            },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_COLOURS, FinancialDark.getDefaultColors());
        params.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, FinancialDark.getWaterfallSeriesDefaultPositiveColors());
        params.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, FinancialDark.getWaterfallSeriesDefaultNegativeColors());
        params.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, FinancialDark.getWaterfallSeriesDefaultTotalColors());

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            FINANCIAL_DARK_FILLS.GREEN,
            FINANCIAL_DARK_FILLS.BLUE,
            FINANCIAL_DARK_FILLS.RED,
        ]);

        params.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            FinancialDark.getWaterfallSeriesDefaultTotalColors().stroke
        );

        params.set(DEFAULT_ANNOTATION_STROKE, FINANCIAL_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, FINANCIAL_DARK_FILLS.BLUE);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
