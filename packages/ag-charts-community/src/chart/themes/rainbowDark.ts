import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
    getSequentialColors,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';

const RAINBOW_DARK_FILLS = {
    RED: '#e6261f',
    ORANGE: '#eb7532',
    YELLOW: '#f7d038',
    GREEN: '#a3e048',
    TEAL: '#49da9a',
    BLUE: '#34bbe6',
    INDIGO: '#4355db',
    VIOLET: '#d23be7',
    GRAY: '#a7a7b7',
};

const RAINBOW_DARK_STROKES = {
    RED: '#ff726e',
    ORANGE: '#ffa86e',
    YELLOW: '#ffe680',
    GREEN: '#c4f07a',
    TEAL: '#7aedb8',
    BLUE: '#7ad4f0',
    INDIGO: '#7a85f0',
    VIOLET: '#e87af0',
    GRAY: '#aeaeae',
};

export class RainbowDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: RAINBOW_DARK_FILLS,
            fillsFallback: Object.values(RAINBOW_DARK_FILLS),
            strokes: RAINBOW_DARK_STROKES,
            sequentialColors: getSequentialColors(RAINBOW_DARK_FILLS),
            divergingColors: [RAINBOW_DARK_FILLS.RED, RAINBOW_DARK_FILLS.YELLOW, RAINBOW_DARK_FILLS.GREEN],
            hierarchyColors: [],
            secondSequentialColors: [
                '#34bbe6',
                '#2fa8cf',
                '#2a95b8',
                '#2582a1',
                '#206f8a',
                '#1b5c73',
                '#16495c',
                '#113645',
            ],
            secondDivergingColors: [RAINBOW_DARK_FILLS.GREEN, RAINBOW_DARK_FILLS.YELLOW, RAINBOW_DARK_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: RAINBOW_DARK_FILLS.GREEN, stroke: RAINBOW_DARK_STROKES.GREEN },
            down: { fill: RAINBOW_DARK_FILLS.RED, stroke: RAINBOW_DARK_STROKES.RED },
            neutral: { fill: RAINBOW_DARK_FILLS.GRAY, stroke: RAINBOW_DARK_STROKES.GRAY },
            altUp: { fill: RAINBOW_DARK_FILLS.BLUE, stroke: RAINBOW_DARK_STROKES.BLUE },
            altDown: { fill: RAINBOW_DARK_FILLS.ORANGE, stroke: RAINBOW_DARK_STROKES.ORANGE },
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
