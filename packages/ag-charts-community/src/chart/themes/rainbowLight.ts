import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

const RAINBOW_LIGHT_FILLS = {
    RED: '#e40303',
    ORANGE: '#ff8c00',
    YELLOW: '#ffed00',
    GREEN: '#008026',
    BLUE: '#004cff',
    INDIGO: '#732982',
    VIOLET: '#9b59b6',
    GRAY: '#bbbbbb',
};

const RAINBOW_LIGHT_STROKES = {
    RED: '#b00202',
    ORANGE: '#c66c00',
    YELLOW: '#c2b300',
    GREEN: '#005e1c',
    BLUE: '#0036b8',
    INDIGO: '#561e62',
    VIOLET: '#71438a',
    GRAY: '#888888',
};

export class RainbowLight extends ChartTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: RAINBOW_LIGHT_FILLS,
            fillsFallback: Object.values(RAINBOW_LIGHT_FILLS),
            strokes: RAINBOW_LIGHT_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_LIGHT_FILLS),
            divergingColors: [RAINBOW_LIGHT_FILLS.BLUE, RAINBOW_LIGHT_FILLS.RED],
            hierarchyColors: [],
            secondSequentialColors: [
                RAINBOW_LIGHT_FILLS.RED,
                RAINBOW_LIGHT_FILLS.ORANGE,
                RAINBOW_LIGHT_FILLS.YELLOW,
                RAINBOW_LIGHT_FILLS.GREEN,
                RAINBOW_LIGHT_FILLS.BLUE,
                RAINBOW_LIGHT_FILLS.INDIGO,
                RAINBOW_LIGHT_FILLS.VIOLET,
            ],
            secondDivergingColors: [RAINBOW_LIGHT_FILLS.BLUE, RAINBOW_LIGHT_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_LIGHT_FILLS.GREEN, stroke: RAINBOW_LIGHT_STROKES.GREEN },
            down: { fill: RAINBOW_LIGHT_FILLS.RED, stroke: RAINBOW_LIGHT_STROKES.RED },
            neutral: { fill: RAINBOW_LIGHT_FILLS.GRAY, stroke: RAINBOW_LIGHT_STROKES.GRAY },
            altUp: { fill: RAINBOW_LIGHT_FILLS.BLUE, stroke: RAINBOW_LIGHT_STROKES.BLUE },
            altDown: { fill: RAINBOW_LIGHT_FILLS.RED, stroke: RAINBOW_LIGHT_STROKES.RED },
            altNeutral: { fill: RAINBOW_LIGHT_FILLS.GRAY, stroke: RAINBOW_LIGHT_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, RAINBOW_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, RAINBOW_LIGHT_FILLS.BLUE);

        return params;
    }
}
