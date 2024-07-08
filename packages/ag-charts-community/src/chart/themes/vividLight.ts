import type { AgChartThemePalette } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
} from './symbols';

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

const palette: AgChartThemePalette = {
    fills: Object.values(VIVID_FILLS),
    strokes: Object.values(VIVID_STROKES),
};

export class VividLight extends ChartTheme {
    override getDefaultColors() {
        return {
            fills: VIVID_FILLS,
            strokes: VIVID_STROKES,
            up: { fill: VIVID_FILLS.BLUE, stroke: VIVID_STROKES.BLUE },
            down: { fill: VIVID_FILLS.ORANGE, stroke: VIVID_STROKES.ORANGE },
            neutral: { fill: VIVID_FILLS.GRAY, stroke: VIVID_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [VIVID_FILLS.ORANGE, VIVID_FILLS.YELLOW, VIVID_FILLS.GREEN]);

        params.set(DEFAULT_ANNOTATION_STROKE, VIVID_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, VIVID_FILLS.BLUE);

        return params;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
