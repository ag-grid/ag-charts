import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';

const RAINBOW_DARK_FILLS = {
    RED: '#e63946',
    ORANGE: '#f4801f',
    YELLOW: '#f1c40f',
    GREEN: '#2ec27e',
    CYAN: '#22b8cf',
    BLUE: '#3a86ff',
    INDIGO: '#5e60ce',
    VIOLET: '#8a4fff',
    PINK: '#e84393',
    GRAY: '#9aa0a6',
};

const RAINBOW_DARK_STROKES = {
    RED: '#ff7a82',
    ORANGE: '#ffae5c',
    YELLOW: '#ffe45c',
    GREEN: '#6cdfa6',
    CYAN: '#5ee0ee',
    BLUE: '#7fb0ff',
    INDIGO: '#9698ff',
    VIOLET: '#b58eff',
    PINK: '#ff7ab8',
    GRAY: '#d0d4d8',
};

export class RainbowDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: RAINBOW_DARK_FILLS,
            fillsFallback: Object.values(RAINBOW_DARK_FILLS),
            strokes: RAINBOW_DARK_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_DARK_FILLS),
            divergingColors: [RAINBOW_DARK_FILLS.BLUE, RAINBOW_DARK_FILLS.RED],
            hierarchyColors: [],
            secondSequentialColors: [
                RAINBOW_DARK_FILLS.RED,
                RAINBOW_DARK_FILLS.ORANGE,
                RAINBOW_DARK_FILLS.YELLOW,
                RAINBOW_DARK_FILLS.GREEN,
                RAINBOW_DARK_FILLS.CYAN,
                RAINBOW_DARK_FILLS.BLUE,
                RAINBOW_DARK_FILLS.INDIGO,
                RAINBOW_DARK_FILLS.VIOLET,
            ],
            secondDivergingColors: [RAINBOW_DARK_FILLS.BLUE, RAINBOW_DARK_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_DARK_FILLS.GREEN, stroke: RAINBOW_DARK_STROKES.GREEN },
            down: { fill: RAINBOW_DARK_FILLS.RED, stroke: RAINBOW_DARK_STROKES.RED },
            neutral: { fill: RAINBOW_DARK_FILLS.GRAY, stroke: RAINBOW_DARK_STROKES.GRAY },
            altUp: { fill: RAINBOW_DARK_FILLS.BLUE, stroke: RAINBOW_DARK_STROKES.BLUE },
            altDown: { fill: RAINBOW_DARK_FILLS.RED, stroke: RAINBOW_DARK_STROKES.RED },
            altNeutral: { fill: RAINBOW_DARK_FILLS.GRAY, stroke: RAINBOW_DARK_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, RAINBOW_DARK_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, RAINBOW_DARK_FILLS.BLUE);

        return params;
    }
}
