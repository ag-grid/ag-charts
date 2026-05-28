import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

const RAINBOW_LIGHT_FILLS = {
    RED: '#e63946',
    ORANGE: '#f4a261',
    YELLOW: '#ffd60a',
    GREEN: '#2a9d8f',
    BLUE: '#118ab2',
    INDIGO: '#4361ee',
    VIOLET: '#7b2cbf',
    GRAY: '#bbbbbb',
};

const RAINBOW_LIGHT_STROKES = {
    RED: '#b1232f',
    ORANGE: '#c47434',
    YELLOW: '#c9a200',
    GREEN: '#1f7268',
    BLUE: '#0b6986',
    INDIGO: '#2540b5',
    VIOLET: '#561e88',
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
            divergingColors: [RAINBOW_LIGHT_FILLS.RED, RAINBOW_LIGHT_FILLS.BLUE],
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
            secondDivergingColors: [RAINBOW_LIGHT_FILLS.RED, RAINBOW_LIGHT_FILLS.BLUE],
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
