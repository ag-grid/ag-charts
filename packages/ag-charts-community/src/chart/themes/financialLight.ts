import type { AgChartThemePalette } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_COLOURS,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
    DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS,
    DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS,
} from './symbols';

const FINANCIAL_LIGHT_FILLS = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

const FINANCIAL_LIGHT_STROKES = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

const palette: AgChartThemePalette = {
    fills: Object.values(FINANCIAL_LIGHT_FILLS),
    strokes: Object.values(FINANCIAL_LIGHT_STROKES),
};

export class FinancialLight extends ChartTheme {
    protected static override getDefaultColors() {
        return {
            fills: { ...FINANCIAL_LIGHT_FILLS },
            strokes: { ...FINANCIAL_LIGHT_STROKES },
        };
    }

    protected static override getWaterfallSeriesDefaultPositiveColors() {
        return {
            fill: FINANCIAL_LIGHT_FILLS.GREEN,
            stroke: FINANCIAL_LIGHT_STROKES.GREEN,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static override getWaterfallSeriesDefaultNegativeColors() {
        return {
            fill: FINANCIAL_LIGHT_FILLS.RED,
            stroke: FINANCIAL_LIGHT_STROKES.RED,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    protected static override getWaterfallSeriesDefaultTotalColors() {
        return {
            fill: FINANCIAL_LIGHT_FILLS.BLUE,
            stroke: FINANCIAL_LIGHT_STROKES.BLUE,
            label: {
                color: DEFAULT_LABEL_COLOUR,
            },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_COLOURS, FinancialLight.getDefaultColors());
        params.set(DEFAULT_WATERFALL_SERIES_POSITIVE_COLOURS, FinancialLight.getWaterfallSeriesDefaultPositiveColors());
        params.set(DEFAULT_WATERFALL_SERIES_NEGATIVE_COLOURS, FinancialLight.getWaterfallSeriesDefaultNegativeColors());
        params.set(DEFAULT_WATERFALL_SERIES_TOTAL_COLOURS, FinancialLight.getWaterfallSeriesDefaultTotalColors());

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            FINANCIAL_LIGHT_FILLS.GREEN,
            FINANCIAL_LIGHT_FILLS.BLUE,
            FINANCIAL_LIGHT_FILLS.RED,
        ]);

        params.set(
            DEFAULT_WATERFALL_SERIES_CONNECTOR_LINE_STROKE,
            FinancialLight.getWaterfallSeriesDefaultTotalColors().stroke
        );

        params.set(DEFAULT_ANNOTATION_STROKE, FINANCIAL_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, FINANCIAL_LIGHT_FILLS.BLUE);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
