import type { AgChartThemePalette } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
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
    override getDefaultColors() {
        return {
            fills: { ...FINANCIAL_LIGHT_FILLS },
            strokes: { ...FINANCIAL_LIGHT_STROKES },
            up: { fill: FINANCIAL_LIGHT_FILLS.GREEN, stroke: FINANCIAL_LIGHT_STROKES.GREEN },
            down: { fill: FINANCIAL_LIGHT_FILLS.RED, stroke: FINANCIAL_LIGHT_STROKES.RED },
            neutral: { fill: FINANCIAL_LIGHT_FILLS.BLUE, stroke: FINANCIAL_LIGHT_STROKES.BLUE },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            FINANCIAL_LIGHT_FILLS.GREEN,
            FINANCIAL_LIGHT_FILLS.BLUE,
            FINANCIAL_LIGHT_FILLS.RED,
        ]);

        params.set(DEFAULT_ANNOTATION_STROKE, FINANCIAL_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, FINANCIAL_LIGHT_FILLS.BLUE);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
