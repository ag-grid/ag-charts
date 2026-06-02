import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

// Hue-ordered so the series cycle reads as a spectrum (red → violet), with gray as a neutral tail.
const RAINBOW_LIGHT_FILLS = {
    RED: '#f47348',
    ORANGE: '#f2a602',
    YELLOW: '#e9e201',
    GREEN: '#21b448',
    CYAN: '#00b9a2',
    MODERATE_BLUE: '#00aee4',
    BLUE: '#436ff4',
    PURPLE: '#9a7bff',
    MAGENTA: '#d165d2',
    PINK: '#f0598b',
    GRAY: '#bbbbbb',
};

const RAINBOW_LIGHT_STROKES = {
    RED: '#c84b1c',
    ORANGE: '#c87f00',
    YELLOW: '#c1b900',
    GREEN: '#008c1c',
    CYAN: '#00927c',
    MODERATE_BLUE: '#0087bb',
    BLUE: '#2346c9',
    PURPLE: '#7653d4',
    MAGENTA: '#a73da9',
    PINK: '#c32d66',
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
                RAINBOW_LIGHT_FILLS.BLUE,
                RAINBOW_LIGHT_FILLS.PURPLE,
                RAINBOW_LIGHT_FILLS.MAGENTA,
                RAINBOW_LIGHT_FILLS.PINK,
                RAINBOW_LIGHT_FILLS.RED,
                RAINBOW_LIGHT_FILLS.ORANGE,
                RAINBOW_LIGHT_FILLS.YELLOW,
                RAINBOW_LIGHT_FILLS.GREEN,
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
