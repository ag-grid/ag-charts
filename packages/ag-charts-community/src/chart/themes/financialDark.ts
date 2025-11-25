import type { AgChartThemeParams, WithThemeParams } from 'ag-charts-types';

import { DarkTheme } from './darkTheme';
import {
    DEFAULT_CAPTION_ALIGNMENT,
    DEFAULT_CAPTION_LAYOUT_STYLE,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    DEFAULT_TOOLBAR_POSITION,
} from './symbols';
import { getSequentialColors } from './util';

const FINANCIAL_DARK_FILLS = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
    GRAY: '#A9A9A9',
};

const FINANCIAL_DARK_STROKES = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
    GRAY: '#909090',
};

export class FinancialDark extends DarkTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: { ...FINANCIAL_DARK_FILLS },
            fillsFallback: Object.values({ ...FINANCIAL_DARK_FILLS }),
            strokes: { ...FINANCIAL_DARK_STROKES },
            sequentialColors: getSequentialColors(FINANCIAL_DARK_FILLS),
            divergingColors: [FINANCIAL_DARK_FILLS.GREEN, FINANCIAL_DARK_FILLS.BLUE, FINANCIAL_DARK_FILLS.RED],
            // hierarchyColors: [],
            secondSequentialColors: [
                '#5090dc',
                '#4882c6',
                '#4073b0',
                '#38659a',
                '#305684',
                '#28486e',
                '#203a58',
                '#182b42',
            ],
            // secondDivergingColors: [],
            // secondHierarchyColors: [],
            up: { fill: FINANCIAL_DARK_FILLS.GREEN, stroke: FINANCIAL_DARK_STROKES.GREEN },
            down: { fill: FINANCIAL_DARK_FILLS.RED, stroke: FINANCIAL_DARK_STROKES.RED },
            neutral: { fill: FINANCIAL_DARK_FILLS.BLUE, stroke: FINANCIAL_DARK_STROKES.BLUE },
            altUp: { fill: FINANCIAL_DARK_FILLS.GREEN, stroke: FINANCIAL_DARK_STROKES.GREEN },
            altDown: { fill: FINANCIAL_DARK_FILLS.RED, stroke: FINANCIAL_DARK_STROKES.RED },
            altNeutral: { fill: FINANCIAL_DARK_FILLS.GRAY, stroke: FINANCIAL_DARK_STROKES.GRAY },
        };
    }

    override getPublicParameters(): Required<WithThemeParams<AgChartThemeParams>> {
        return {
            ...super.getPublicParameters(),
            chartPadding: 0,
            gridLineColor: { $foregroundBackgroundMix: 0.12 },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, FINANCIAL_DARK_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, FINANCIAL_DARK_FILLS.BLUE);

        params.set(DEFAULT_CAPTION_LAYOUT_STYLE, 'overlay');
        params.set(DEFAULT_CAPTION_ALIGNMENT, 'left');
        params.set(DEFAULT_TOOLBAR_POSITION, 'bottom');

        return params;
    }
}
