import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';

const RAINBOW_DARK_FILLS = {
    RED: '#e40303',
    ORANGE: '#ff8c00',
    YELLOW: '#ffed00',
    GREEN: '#008026',
    BLUE: '#004cff',
    INDIGO: '#732982',
    VIOLET: '#9b59b6',
    GRAY: '#bbbbbb',
};

const RAINBOW_DARK_STROKES = {
    RED: '#ff5959',
    ORANGE: '#ffb151',
    YELLOW: '#fff759',
    GREEN: '#3aae5b',
    BLUE: '#5b86ff',
    INDIGO: '#a45cb2',
    VIOLET: '#bf86d6',
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
                RAINBOW_DARK_FILLS.GREEN,
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
