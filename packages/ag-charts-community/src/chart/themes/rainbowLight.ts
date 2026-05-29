import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';

const RAINBOW_FILLS = {
    RED: '#e6261f',
    ORANGE: '#eb7532',
    AMBER: '#f7d038',
    YELLOW: '#a3e048',
    GREEN: '#49da9a',
    TEAL: '#34bbe6',
    BLUE: '#4355db',
    INDIGO: '#6f51d8',
    VIOLET: '#9b59b6',
    MAGENTA: '#d23be7',
};

const RAINBOW_STROKES = {
    RED: '#b31e18',
    ORANGE: '#bc5e28',
    AMBER: '#c5a72d',
    YELLOW: '#82b33a',
    GREEN: '#3aae7b',
    TEAL: '#2995b8',
    BLUE: '#3544af',
    INDIGO: '#5840ac',
    VIOLET: '#7c4791',
    MAGENTA: '#a72fb8',
};

export class RainbowLight extends ChartTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: RAINBOW_FILLS,
            fillsFallback: Object.values(RAINBOW_FILLS),
            strokes: RAINBOW_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_FILLS),
            divergingColors: [RAINBOW_FILLS.RED, RAINBOW_FILLS.AMBER, RAINBOW_FILLS.GREEN],
            hierarchyColors: [],
            secondSequentialColors: [
                '#4355db',
                '#5566df',
                '#6777e3',
                '#7988e7',
                '#8b99eb',
                '#9daaef',
                '#afbbf3',
                '#c1ccf7',
            ],
            secondDivergingColors: [RAINBOW_FILLS.GREEN, RAINBOW_FILLS.AMBER, RAINBOW_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_FILLS.GREEN, stroke: RAINBOW_STROKES.GREEN },
            down: { fill: RAINBOW_FILLS.RED, stroke: RAINBOW_STROKES.RED },
            neutral: { fill: RAINBOW_FILLS.BLUE, stroke: RAINBOW_STROKES.BLUE },
            altUp: { fill: RAINBOW_FILLS.TEAL, stroke: RAINBOW_STROKES.TEAL },
            altDown: { fill: RAINBOW_FILLS.ORANGE, stroke: RAINBOW_STROKES.ORANGE },
            altNeutral: { fill: RAINBOW_FILLS.BLUE, stroke: RAINBOW_STROKES.BLUE },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, RAINBOW_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, RAINBOW_FILLS.BLUE);

        return params;
    }
}
