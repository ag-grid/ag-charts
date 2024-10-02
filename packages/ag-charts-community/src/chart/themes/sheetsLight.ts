import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_COLOR,
    DEFAULT_DIVERGING_SERIES_COLOR_RANGE,
    DEFAULT_GAUGE_SERIES_COLOR_RANGE,
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

export class SheetsLight extends ChartTheme {
    override getDefaultColors() {
        return {
            fills: { ...SHEETS_LIGHT_FILLS, RED: SHEETS_LIGHT_FILLS.ORANGE },
            strokes: { ...SHEETS_LIGHT_STROKES, RED: SHEETS_LIGHT_STROKES.ORANGE },
            up: { fill: SHEETS_LIGHT_FILLS.GREEN, stroke: SHEETS_LIGHT_STROKES.GREEN },
            down: { fill: SHEETS_LIGHT_FILLS.ORANGE, stroke: SHEETS_LIGHT_STROKES.ORANGE },
            neutral: { fill: SHEETS_LIGHT_STROKES.GRAY, stroke: SHEETS_LIGHT_STROKES.GRAY },
            altUp: { fill: SHEETS_LIGHT_FILLS.BLUE, stroke: SHEETS_LIGHT_STROKES.BLUE },
            altDown: { fill: SHEETS_LIGHT_FILLS.ORANGE, stroke: SHEETS_LIGHT_STROKES.ORANGE },
            altNeutral: { fill: SHEETS_LIGHT_FILLS.GRAY, stroke: SHEETS_LIGHT_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOR_RANGE, [
            SHEETS_LIGHT_FILLS.ORANGE,
            SHEETS_LIGHT_FILLS.YELLOW,
            SHEETS_LIGHT_FILLS.GREEN,
        ]);
        params.set(DEFAULT_GAUGE_SERIES_COLOR_RANGE, [
            SHEETS_LIGHT_FILLS.GREEN,
            SHEETS_LIGHT_FILLS.YELLOW,
            SHEETS_LIGHT_FILLS.ORANGE,
        ]);

        params.set(DEFAULT_ANNOTATION_COLOR, SHEETS_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, SHEETS_LIGHT_FILLS.BLUE);

        return params;
    }
}
