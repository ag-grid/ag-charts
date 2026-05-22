import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

const RAINBOW_LIGHT_FILLS = {
    RED: '#e23636',
    ORANGE: '#f08a24',
    YELLOW: '#f0c419',
    GREEN: '#2fa84f',
    BLUE: '#2a7fdb',
    INDIGO: '#4b3ea3',
    VIOLET: '#8a3a9f',
};

/** Hand-derived from `RAINBOW_LIGHT_FILLS`: each stroke is roughly 30% darker than its matching fill. Update both in lockstep. */
const RAINBOW_LIGHT_STROKES = {
    RED: '#9e2626',
    ORANGE: '#a8601a',
    YELLOW: '#a88912',
    GREEN: '#217637',
    BLUE: '#1d5999',
    INDIGO: '#352c72',
    VIOLET: '#60286f',
};

export class RainbowLight extends ChartTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: RAINBOW_LIGHT_FILLS,
            fillsFallback: Object.values(RAINBOW_LIGHT_FILLS),
            strokes: RAINBOW_LIGHT_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_LIGHT_FILLS),
            divergingColors: [RAINBOW_LIGHT_FILLS.RED, RAINBOW_LIGHT_FILLS.YELLOW, RAINBOW_LIGHT_FILLS.BLUE],
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
            secondDivergingColors: [RAINBOW_LIGHT_FILLS.RED, RAINBOW_LIGHT_FILLS.YELLOW, RAINBOW_LIGHT_FILLS.BLUE],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_LIGHT_FILLS.GREEN, stroke: RAINBOW_LIGHT_STROKES.GREEN },
            down: { fill: RAINBOW_LIGHT_FILLS.RED, stroke: RAINBOW_LIGHT_STROKES.RED },
            neutral: { fill: RAINBOW_LIGHT_FILLS.YELLOW, stroke: RAINBOW_LIGHT_STROKES.YELLOW },
            altUp: { fill: RAINBOW_LIGHT_FILLS.BLUE, stroke: RAINBOW_LIGHT_STROKES.BLUE },
            altDown: { fill: RAINBOW_LIGHT_FILLS.ORANGE, stroke: RAINBOW_LIGHT_STROKES.ORANGE },
            altNeutral: { fill: RAINBOW_LIGHT_FILLS.INDIGO, stroke: RAINBOW_LIGHT_STROKES.INDIGO },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, RAINBOW_LIGHT_FILLS.RED);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, RAINBOW_LIGHT_FILLS.RED);

        return params;
    }
}
