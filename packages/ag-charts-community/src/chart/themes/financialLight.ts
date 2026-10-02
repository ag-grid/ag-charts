import { getSequentialColors } from 'ag-charts-core';
import type { AgChartAllThemeParams, WithThemeParams } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';

const FINANCIAL_LIGHT_FILLS = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
    GRAY: '#A9A9A9',
};

const FINANCIAL_LIGHT_STROKES = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
    GRAY: '#909090',
};

export class FinancialLight extends ChartTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: { ...FINANCIAL_LIGHT_FILLS },
            fillsFallback: Object.values({ ...FINANCIAL_LIGHT_FILLS }),
            strokes: { ...FINANCIAL_LIGHT_STROKES },
            sequentialColors: getSequentialColors(FINANCIAL_LIGHT_FILLS),
            divergingColors: [FINANCIAL_LIGHT_FILLS.GREEN, FINANCIAL_LIGHT_FILLS.BLUE, FINANCIAL_LIGHT_FILLS.RED],
            // hierarchyColors: [],
            // secondSequentialColors: [],
            // secondDivergingColors: [],
            // secondHierarchyColors: [],
            up: { fill: FINANCIAL_LIGHT_FILLS.GREEN, stroke: FINANCIAL_LIGHT_STROKES.GREEN },
            down: { fill: FINANCIAL_LIGHT_FILLS.RED, stroke: FINANCIAL_LIGHT_STROKES.RED },
            neutral: { fill: FINANCIAL_LIGHT_FILLS.BLUE, stroke: FINANCIAL_LIGHT_STROKES.BLUE },
            altUp: { fill: FINANCIAL_LIGHT_FILLS.GREEN, stroke: FINANCIAL_LIGHT_STROKES.GREEN },
            altDown: { fill: FINANCIAL_LIGHT_FILLS.RED, stroke: FINANCIAL_LIGHT_STROKES.RED },
            altNeutral: { fill: FINANCIAL_LIGHT_FILLS.GRAY, stroke: FINANCIAL_LIGHT_STROKES.GRAY },
        };
    }

    override getThemeParameters(): Required<WithThemeParams<AgChartAllThemeParams>> {
        return {
            ...super.getThemeParameters(),
            chartPadding: 0,
            annotationColor: FINANCIAL_LIGHT_FILLS.BLUE,
            captionLayoutStyle: 'overlay',
            captionAlignment: 'left',
            gridLineColor: { $foregroundBackgroundMix: 0.06 },
        };
    }
}
