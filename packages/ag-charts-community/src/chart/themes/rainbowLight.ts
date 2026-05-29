import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

const RAINBOW_LIGHT_FILLS = {
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

const RAINBOW_LIGHT_STROKES = {
    RED: '#b3242d',
    ORANGE: '#c25c00',
    YELLOW: '#b8930a',
    GREEN: '#1f8a59',
    CYAN: '#188a99',
    BLUE: '#1e5fcf',
    INDIGO: '#3f41a8',
    VIOLET: '#6533cc',
    PINK: '#b32d70',
    GRAY: '#666c70',
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
                RAINBOW_LIGHT_FILLS.CYAN,
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
