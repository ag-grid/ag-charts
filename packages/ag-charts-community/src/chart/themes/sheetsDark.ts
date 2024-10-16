import { DarkTheme } from './darkTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_COLOR,
    DEFAULT_DIVERGING_SERIES_COLOR_RANGE,
    DEFAULT_GAUGE_SERIES_COLOR_RANGE,
} from './symbols';

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
            fills: { ...SHEETS_DARK_FILLS, RED: SHEETS_DARK_FILLS.ORANGE },
            strokes: { ...SHEETS_DARK_STROKES, RED: SHEETS_DARK_STROKES.ORANGE },
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

        params.set(DEFAULT_DIVERGING_SERIES_COLOR_RANGE, [
            SHEETS_DARK_FILLS.ORANGE,
            SHEETS_DARK_FILLS.YELLOW,
            SHEETS_DARK_FILLS.GREEN,
        ]);
        params.set(DEFAULT_GAUGE_SERIES_COLOR_RANGE, [
            SHEETS_DARK_FILLS.GREEN,
            SHEETS_DARK_FILLS.YELLOW,
            SHEETS_DARK_FILLS.ORANGE,
        ]);

        params.set(DEFAULT_ANNOTATION_COLOR, SHEETS_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, SHEETS_DARK_FILLS.BLUE);

        return params;
    }
}
