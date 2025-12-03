import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
} from 'ag-charts-core';

import { ChartTheme } from './chartTheme';
import { getSequentialColors } from './util';

const VIVID_FILLS = {
    BLUE: '#0083ff',
    ORANGE: '#ff6600',
    GREEN: '#00af00',
    CYAN: '#00ccff',
    YELLOW: '#f7c700',
    VIOLET: '#ac26ff',
    GRAY: '#a7a7b7',
    MAGENTA: '#e800c5',
    BROWN: '#b54300',
    RED: '#ff0000',
};

const VIVID_STROKES = {
    BLUE: '#0f68c0',
    ORANGE: '#d47100',
    GREEN: '#007922',
    CYAN: '#009ac2',
    VIOLET: '#bca400',
    YELLOW: '#753cac',
    GRAY: '#646464',
    MAGENTA: '#9b2685',
    BROWN: '#6c3b00',
    RED: '#cb0021',
};

export class VividLight extends ChartTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: VIVID_FILLS,
            fillsFallback: Object.values(VIVID_FILLS),
            strokes: VIVID_STROKES,
            sequentialColors: getSequentialColors(VIVID_FILLS),
            divergingColors: [VIVID_FILLS.ORANGE, VIVID_FILLS.YELLOW, VIVID_FILLS.GREEN],
            hierarchyColors: [],
            secondSequentialColors: [
                '#0083ff',
                '#1a8fff',
                '#339cff',
                '#4da8ff',
                '#66b5ff',
                '#80c1ff',
                '#99cdff',
                '#b3daff',
            ],
            secondDivergingColors: [VIVID_FILLS.GREEN, VIVID_FILLS.YELLOW, VIVID_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: VIVID_FILLS.GREEN, stroke: VIVID_STROKES.GREEN },
            down: { fill: VIVID_FILLS.RED, stroke: VIVID_STROKES.RED },
            neutral: { fill: VIVID_FILLS.GRAY, stroke: VIVID_STROKES.GRAY },
            altUp: { fill: VIVID_FILLS.BLUE, stroke: VIVID_STROKES.BLUE },
            altDown: { fill: VIVID_FILLS.ORANGE, stroke: VIVID_STROKES.ORANGE },
            altNeutral: { fill: VIVID_FILLS.GRAY, stroke: VIVID_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, VIVID_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, VIVID_FILLS.BLUE);

        return params;
    }
}
