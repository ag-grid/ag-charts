import type { AgChartThemePalette } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
} from './symbols';

const SHEETS_LIGHT_FILLS = {
    BLUE: '#5281d5',
    ORANGE: '#ff8d44',
    GRAY: '#b5b5b5',
    YELLOW: '#ffd02f',
    MODERATE_BLUE: '#6aabe6',
    GREEN: '#7fbd57',
    DARK_GRAY: '#8a8a8a',
    DARK_BLUE: '#335287',
    VERY_DARK_GRAY: '#717171',
    DARK_YELLOW: '#a98220',
};

const SHEETS_LIGHT_STROKES = {
    BLUE: '#214d9b',
    ORANGE: '#c25600',
    GRAY: '#7f7f7f',
    YELLOW: '#d59800',
    MODERATE_BLUE: '#3575ac',
    GREEN: '#4b861a',
    DARK_GRAY: '#575757',
    DARK_BLUE: '#062253',
    VERY_DARK_GRAY: '#414141',
    DARK_YELLOW: '#734f00',
};

const palette: AgChartThemePalette = {
    fills: Object.values(SHEETS_LIGHT_FILLS),
    strokes: Object.values(SHEETS_LIGHT_STROKES),
};

export class SheetsLight extends ChartTheme {
    override getDefaultColors() {
        return {
            fills: { ...SHEETS_LIGHT_FILLS, RED: SHEETS_LIGHT_FILLS.ORANGE },
            strokes: { ...SHEETS_LIGHT_STROKES, RED: SHEETS_LIGHT_STROKES.ORANGE },
            up: { fill: SHEETS_LIGHT_STROKES.BLUE, stroke: SHEETS_LIGHT_FILLS.BLUE },
            down: { fill: SHEETS_LIGHT_STROKES.ORANGE, stroke: SHEETS_LIGHT_FILLS.ORANGE },
            neutral: { fill: SHEETS_LIGHT_STROKES.GRAY, stroke: SHEETS_LIGHT_FILLS.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            SHEETS_LIGHT_FILLS.ORANGE,
            SHEETS_LIGHT_FILLS.YELLOW,
            SHEETS_LIGHT_FILLS.GREEN,
        ]);

        params.set(DEFAULT_ANNOTATION_STROKE, SHEETS_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, SHEETS_LIGHT_FILLS.BLUE);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
