import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

const RAINBOW_LIGHT_FILLS = {
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

const RAINBOW_LIGHT_STROKES = {
    RED: '#b8102e',
    ORANGE: '#c46518',
    YELLOW: '#ccb400',
    LIME: '#96c02a',
    GREEN: '#1e8c2e',
    CYAN: '#1fa9c5',
    BLUE: '#2840a8',
    PURPLE: '#6e0e8a',
    MAGENTA: '#c018b8',
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
                RAINBOW_LIGHT_FILLS.LIME,
                RAINBOW_LIGHT_FILLS.GREEN,
                RAINBOW_LIGHT_FILLS.CYAN,
                RAINBOW_LIGHT_FILLS.BLUE,
                RAINBOW_LIGHT_FILLS.PURPLE,
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
