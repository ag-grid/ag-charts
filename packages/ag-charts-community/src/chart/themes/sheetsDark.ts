import {
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR,
} from 'ag-charts-core';

import { DarkTheme } from './darkTheme';
import { getSequentialColors } from './util';

const SHEETS_DARK_FILLS = {
    BLUE: '#4472C4',
    ORANGE: '#ED7D31',
    GRAY: '#A5A5A5',
    YELLOW: '#FFC000',
    MODERATE_BLUE: '#5B9BD5',
    GREEN: '#70AD47',
    DARK_GRAY: '#7B7B7B',
    DARK_BLUE: '#264478',
    VERY_DARK_GRAY: '#636363',
    DARK_YELLOW: '#997300',
};

const SHEETS_DARK_STROKES = {
    BLUE: '#6899ee',
    ORANGE: '#ffa55d',
    GRAY: '#cdcdcd',
    YELLOW: '#ffea53',
    MODERATE_BLUE: '#82c3ff',
    GREEN: '#96d56f',
    DARK_GRAY: '#a1a1a1',
    DARK_BLUE: '#47689f',
    VERY_DARK_GRAY: '#878787',
    DARK_YELLOW: '#c0993d',
};

export class SheetsDark extends DarkTheme {
    override getDefaultColors() {
        return {
            ...super.getDefaultColors(),
            fills: { ...SHEETS_DARK_FILLS, RED: SHEETS_DARK_FILLS.ORANGE },
            fillsFallback: Object.values({ ...SHEETS_DARK_FILLS, RED: SHEETS_DARK_FILLS.ORANGE }),
            strokes: { ...SHEETS_DARK_STROKES, RED: SHEETS_DARK_STROKES.ORANGE },
            sequentialColors: getSequentialColors({ ...SHEETS_DARK_FILLS, RED: SHEETS_DARK_FILLS.ORANGE }),
            divergingColors: [SHEETS_DARK_FILLS.ORANGE, SHEETS_DARK_FILLS.YELLOW, SHEETS_DARK_FILLS.GREEN],
            // hierarchyColors: [],
            secondSequentialColors: [
                '#5090dc',
                '#4882c6',
                '#4073b0',
                '#38659a',
                '#305684',
                '#28486e',
                '#203a58',
                '#182b42',
            ],
            secondDivergingColors: [SHEETS_DARK_FILLS.GREEN, SHEETS_DARK_FILLS.YELLOW, SHEETS_DARK_FILLS.ORANGE],
            // secondHierarchyColors: [],
            up: { fill: SHEETS_DARK_FILLS.GREEN, stroke: SHEETS_DARK_STROKES.GREEN },
            down: { fill: SHEETS_DARK_FILLS.ORANGE, stroke: SHEETS_DARK_STROKES.ORANGE },
            neutral: { fill: SHEETS_DARK_FILLS.GRAY, stroke: SHEETS_DARK_STROKES.GRAY },
            altUp: { fill: SHEETS_DARK_FILLS.BLUE, stroke: SHEETS_DARK_STROKES.BLUE },
            altDown: { fill: SHEETS_DARK_FILLS.ORANGE, stroke: SHEETS_DARK_STROKES.ORANGE },
            altNeutral: { fill: SHEETS_DARK_FILLS.GRAY, stroke: SHEETS_DARK_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_COLOR, SHEETS_DARK_FILLS.BLUE);
        params.set(DEFAULT_FINANCIAL_CHARTS_ANNOTATION_BACKGROUND_FILL, SHEETS_DARK_FILLS.BLUE);

        return params;
    }
}
