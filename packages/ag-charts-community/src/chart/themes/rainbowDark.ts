import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';

const RAINBOW_DARK_FILLS = {
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

const RAINBOW_DARK_STROKES = {
    RED: '#ef615b',
    ORANGE: '#f29a6c',
    AMBER: '#f9dd72',
    YELLOW: '#bce882',
    GREEN: '#7ee6bb',
    TEAL: '#71cfee',
    BLUE: '#7d8ae6',
    INDIGO: '#9a85e4',
    VIOLET: '#bb88cd',
    MAGENTA: '#df74ee',
};

export class RainbowDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: RAINBOW_DARK_FILLS,
            fillsFallback: Object.values(RAINBOW_DARK_FILLS),
            strokes: RAINBOW_DARK_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_DARK_FILLS),
            divergingColors: [RAINBOW_DARK_FILLS.RED, RAINBOW_DARK_FILLS.AMBER, RAINBOW_DARK_FILLS.GREEN],
            hierarchyColors: [],
            secondSequentialColors: [
                '#4355db',
                '#3d4cc5',
                '#3744af',
                '#313b99',
                '#2b3383',
                '#252a6d',
                '#1f2257',
                '#191941',
            ],
            secondDivergingColors: [RAINBOW_DARK_FILLS.GREEN, RAINBOW_DARK_FILLS.AMBER, RAINBOW_DARK_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_DARK_FILLS.GREEN, stroke: RAINBOW_DARK_STROKES.GREEN },
            down: { fill: RAINBOW_DARK_FILLS.RED, stroke: RAINBOW_DARK_STROKES.RED },
            neutral: { fill: RAINBOW_DARK_FILLS.BLUE, stroke: RAINBOW_DARK_STROKES.BLUE },
            altUp: { fill: RAINBOW_DARK_FILLS.TEAL, stroke: RAINBOW_DARK_STROKES.TEAL },
            altDown: { fill: RAINBOW_DARK_FILLS.ORANGE, stroke: RAINBOW_DARK_STROKES.ORANGE },
            altNeutral: { fill: RAINBOW_DARK_FILLS.BLUE, stroke: RAINBOW_DARK_STROKES.BLUE },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, RAINBOW_DARK_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, RAINBOW_DARK_FILLS.BLUE);

        return params;
    }
}
