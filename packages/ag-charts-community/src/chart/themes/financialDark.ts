import { getSequentialColors } from 'ag-charts-core';
import type { AgChartAllThemeParams, WithThemeParams } from 'ag-charts-types';

import { DarkTheme } from './darkTheme';

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

    override getThemeParameters(): Required<WithThemeParams<AgChartAllThemeParams>> {
        return {
            ...super.getThemeParameters(),
            chartPadding: 0,
            captionLayoutStyle: 'overlay',
            captionAlignment: 'left',
            gridLineColor: { $foregroundBackgroundMix: 0.12 },
        };
    }
}
