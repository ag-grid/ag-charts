import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

const RAINBOW_FILLS = {
    RED: '#e6261f',
    ORANGE: '#eb7532',
    YELLOW: '#f7d038',
    GREEN: '#a3e048',
    TEAL: '#49da9a',
    BLUE: '#34bbe6',
    INDIGO: '#4355db',
    VIOLET: '#d23be7',
    GRAY: '#a7a7b7',
};

const RAINBOW_STROKES = {
    RED: '#c41e19',
    ORANGE: '#c8632b',
    YELLOW: '#d4b130',
    GREEN: '#8bbf3d',
    TEAL: '#3eba84',
    BLUE: '#2c9fc4',
    INDIGO: '#3948ba',
    VIOLET: '#b332c5',
    GRAY: '#646464',
};

export class RainbowLight extends ChartTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: RAINBOW_FILLS,
            fillsFallback: Object.values(RAINBOW_FILLS),
            strokes: RAINBOW_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_FILLS),
            divergingColors: [RAINBOW_FILLS.RED, RAINBOW_FILLS.YELLOW, RAINBOW_FILLS.GREEN],
            hierarchyColors: [],
            secondSequentialColors: [
                '#34bbe6',
                '#3fadcf',
                '#4a9fb8',
                '#5591a1',
                '#60838a',
                '#6b7573',
                '#76675c',
                '#815945',
            ],
            secondDivergingColors: [RAINBOW_FILLS.GREEN, RAINBOW_FILLS.YELLOW, RAINBOW_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_FILLS.GREEN, stroke: RAINBOW_STROKES.GREEN },
            down: { fill: RAINBOW_FILLS.RED, stroke: RAINBOW_STROKES.RED },
            neutral: { fill: RAINBOW_FILLS.GRAY, stroke: RAINBOW_STROKES.GRAY },
            altUp: { fill: RAINBOW_FILLS.BLUE, stroke: RAINBOW_STROKES.BLUE },
            altDown: { fill: RAINBOW_FILLS.ORANGE, stroke: RAINBOW_STROKES.ORANGE },
            altNeutral: { fill: RAINBOW_FILLS.GRAY, stroke: RAINBOW_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, RAINBOW_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, RAINBOW_FILLS.BLUE);

        return params;
    }
}
