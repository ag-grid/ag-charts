import type { AgChartThemeParams, WithThemeParams } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import {
    DEFAULT_CAPTION_ALIGNMENT,
    DEFAULT_CAPTION_LAYOUT_STYLE,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    DEFAULT_TOOLBAR_POSITION,
} from './symbols';
import { getSequentialColors } from './util';

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

    override getPublicParameters(): Required<WithThemeParams<AgChartThemeParams>> {
        return {
            ...super.getPublicParameters(),
            chartPadding: 0,
            gridLineColor: { $foregroundBackgroundMix: 0.06 },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, FINANCIAL_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, FINANCIAL_LIGHT_FILLS.BLUE);

        params.set(DEFAULT_CAPTION_LAYOUT_STYLE, 'overlay');
        params.set(DEFAULT_CAPTION_ALIGNMENT, 'left');
        params.set(DEFAULT_TOOLBAR_POSITION, 'bottom');

        return params;
    }
}
