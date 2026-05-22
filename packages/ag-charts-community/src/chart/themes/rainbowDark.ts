import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';

const RAINBOW_DARK_FILLS = {
    RED: '#e23636',
    ORANGE: '#f08a24',
    YELLOW: '#f0c419',
    GREEN: '#2fa84f',
    BLUE: '#2a7fdb',
    INDIGO: '#4b3ea3',
    VIOLET: '#8a3a9f',
};

const RAINBOW_DARK_STROKES = {
    RED: '#ff6e6e',
    ORANGE: '#ffb466',
    YELLOW: '#ffe066',
    GREEN: '#6cd683',
    BLUE: '#6aabec',
    INDIGO: '#8071ce',
    VIOLET: '#bb6cce',
};

export class RainbowDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: RAINBOW_DARK_FILLS,
            fillsFallback: Object.values(RAINBOW_DARK_FILLS),
            strokes: RAINBOW_DARK_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_DARK_FILLS),
            divergingColors: [RAINBOW_DARK_FILLS.RED, RAINBOW_DARK_FILLS.YELLOW, RAINBOW_DARK_FILLS.BLUE],
            hierarchyColors: [],
            secondSequentialColors: [
                RAINBOW_DARK_FILLS.RED,
                RAINBOW_DARK_FILLS.ORANGE,
                RAINBOW_DARK_FILLS.YELLOW,
                RAINBOW_DARK_FILLS.GREEN,
                RAINBOW_DARK_FILLS.BLUE,
                RAINBOW_DARK_FILLS.INDIGO,
                RAINBOW_DARK_FILLS.VIOLET,
            ],
            secondDivergingColors: [RAINBOW_DARK_FILLS.RED, RAINBOW_DARK_FILLS.YELLOW, RAINBOW_DARK_FILLS.BLUE],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_DARK_FILLS.GREEN, stroke: RAINBOW_DARK_STROKES.GREEN },
            down: { fill: RAINBOW_DARK_FILLS.RED, stroke: RAINBOW_DARK_STROKES.RED },
            neutral: { fill: RAINBOW_DARK_FILLS.YELLOW, stroke: RAINBOW_DARK_STROKES.YELLOW },
            altUp: { fill: RAINBOW_DARK_FILLS.BLUE, stroke: RAINBOW_DARK_STROKES.BLUE },
            altDown: { fill: RAINBOW_DARK_FILLS.ORANGE, stroke: RAINBOW_DARK_STROKES.ORANGE },
            altNeutral: { fill: RAINBOW_DARK_FILLS.INDIGO, stroke: RAINBOW_DARK_STROKES.INDIGO },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, RAINBOW_DARK_FILLS.RED);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, RAINBOW_DARK_FILLS.RED);

        return params;
    }
}
