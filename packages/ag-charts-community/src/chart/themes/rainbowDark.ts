import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';

const RAINBOW_DARK_FILLS = {
    RED: '#e6194b',
    ORANGE: '#f58231',
    YELLOW: '#ffe119',
    LIME: '#bfef45',
    GREEN: '#3cb44b',
    CYAN: '#42d4f4',
    BLUE: '#4363d8',
    PURPLE: '#911eb4',
    MAGENTA: '#f032e6',
    GRAY: '#bbbbbb',
};

const RAINBOW_DARK_STROKES = {
    RED: '#ff4a73',
    ORANGE: '#ffaa5e',
    YELLOW: '#ffff58',
    LIME: '#d8ff70',
    GREEN: '#58dd70',
    CYAN: '#6eedff',
    BLUE: '#6b8fff',
    PURPLE: '#b94edc',
    MAGENTA: '#ff5ef2',
    GRAY: '#eeeeee',
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
                RAINBOW_DARK_FILLS.LIME,
                RAINBOW_DARK_FILLS.GREEN,
                RAINBOW_DARK_FILLS.CYAN,
                RAINBOW_DARK_FILLS.BLUE,
                RAINBOW_DARK_FILLS.PURPLE,
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
