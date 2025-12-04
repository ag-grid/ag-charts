import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';
import { getSequentialColors } from './util';

const VIVID_DARK_FILLS = {
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

const VIVID_DARK_STROKES = {
    BLUE: '#67b7ff',
    ORANGE: '#ffc24d',
    GREEN: '#5cc86f',
    CYAN: '#54ebff',
    VIOLET: '#fff653',
    YELLOW: '#c18aff',
    GRAY: '#aeaeae',
    MAGENTA: '#f078d4',
    BROWN: '#ba8438',
    RED: '#ff726e',
};

export class VividDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: VIVID_DARK_FILLS,
            fillsFallback: Object.values(VIVID_DARK_FILLS),
            strokes: VIVID_DARK_STROKES,
            sequentialColors: getSequentialColors(VIVID_DARK_FILLS),
            divergingColors: [VIVID_DARK_FILLS.ORANGE, VIVID_DARK_FILLS.YELLOW, VIVID_DARK_FILLS.GREEN],
            hierarchyColors: [],
            secondSequentialColors: [
                '#0083ff',
                '#0076e6',
                '#0069cc',
                '#005cb3',
                '#004f99',
                '#004280',
                '#003466',
                '#00274c',
            ],
            secondDivergingColors: [VIVID_DARK_FILLS.GREEN, VIVID_DARK_FILLS.YELLOW, VIVID_DARK_FILLS.RED],
            secondHierarchyColors: [],
            up: { fill: VIVID_DARK_FILLS.GREEN, stroke: VIVID_DARK_STROKES.GREEN },
            down: { fill: VIVID_DARK_FILLS.RED, stroke: VIVID_DARK_STROKES.RED },
            neutral: { fill: VIVID_DARK_FILLS.GRAY, stroke: VIVID_DARK_STROKES.GRAY },
            altUp: { fill: VIVID_DARK_FILLS.BLUE, stroke: VIVID_DARK_STROKES.BLUE },
            altDown: { fill: VIVID_DARK_FILLS.ORANGE, stroke: VIVID_DARK_STROKES.ORANGE },
            altNeutral: { fill: VIVID_DARK_FILLS.GRAY, stroke: VIVID_DARK_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, VIVID_DARK_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, VIVID_DARK_FILLS.BLUE);

        return params;
    }
}
