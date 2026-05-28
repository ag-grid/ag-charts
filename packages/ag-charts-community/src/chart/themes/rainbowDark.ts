import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';

const RAINBOW_DARK_FILLS = {
    RED: '#e63946',
    ORANGE: '#f4a261',
    YELLOW: '#ffd60a',
    GREEN: '#2a9d8f',
    BLUE: '#118ab2',
    INDIGO: '#4361ee',
    VIOLET: '#7b2cbf',
    GRAY: '#bbbbbb',
};

const RAINBOW_DARK_STROKES = {
    RED: '#ff6b78',
    ORANGE: '#ffc285',
    YELLOW: '#fff066',
    GREEN: '#56c8bb',
    BLUE: '#4cb8d8',
    INDIGO: '#7088ff',
    VIOLET: '#a55ee0',
    GRAY: '#eeeeee',
};

export class RainbowDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: RAINBOW_DARK_FILLS,
            fillsFallback: Object.values(RAINBOW_DARK_FILLS),
            strokes: RAINBOW_DARK_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_DARK_FILLS),
            divergingColors: [RAINBOW_DARK_FILLS.RED, RAINBOW_DARK_FILLS.BLUE],
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
            secondDivergingColors: [RAINBOW_DARK_FILLS.RED, RAINBOW_DARK_FILLS.BLUE],
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
