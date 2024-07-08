import type { AgChartThemePalette } from 'ag-charts-types';

import { DarkTheme } from './darkTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
} from './symbols';

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

const palette: AgChartThemePalette = {
    fills: Object.values(VIVID_DARK_FILLS),
    strokes: Object.values(VIVID_DARK_STROKES),
};

export class VividDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: VIVID_DARK_FILLS,
            strokes: VIVID_DARK_STROKES,
            up: { fill: VIVID_DARK_FILLS.BLUE, stroke: VIVID_DARK_STROKES.BLUE },
            down: { fill: VIVID_DARK_FILLS.ORANGE, stroke: VIVID_DARK_STROKES.ORANGE },
            neutral: { fill: VIVID_DARK_FILLS.GRAY, stroke: VIVID_DARK_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            VIVID_DARK_FILLS.ORANGE,
            VIVID_DARK_FILLS.YELLOW,
            VIVID_DARK_FILLS.GREEN,
        ]);

        params.set(DEFAULT_ANNOTATION_STROKE, VIVID_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, VIVID_DARK_FILLS.BLUE);

        return params;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
