import type { AgChartThemePalette } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
} from './symbols';

const POLYCHROMA_LIGHT_FILLS = {
    BLUE: '#436ff4',
    PURPLE: '#9a7bff',
    MAGENTA: '#d165d2',
    PINK: '#f0598b',
    RED: '#f47348',
    ORANGE: '#f2a602',
    YELLOW: '#e9e201',
    GREEN: '#21b448',
    CYAN: '#00b9a2',
    MODERATE_BLUE: '#00aee4',
};

const POLYCHROMA_LIGHT_STROKES = {
    BLUE: '#2346c9',
    PURPLE: '#7653d4',
    MAGENTA: '#a73da9',
    PINK: '#c32d66',
    RED: '#c84b1c',
    ORANGE: '#c87f00',
    YELLOW: '#c1b900',
    GREEN: '#008c1c',
    CYAN: '#00927c',
    MODERATE_BLUE: '#0087bb',
};

const POLYCHROMA_LIGHT_FILL_GRAY = '#bbbbbb';
const POLYCHROMA_LIGHT_STROKE_GRAY = '#888888';

const palette: AgChartThemePalette = {
    fills: Object.values(POLYCHROMA_LIGHT_FILLS),
    strokes: Object.values(POLYCHROMA_LIGHT_STROKES),
};

export class PolychromaLight extends ChartTheme {
    override getDefaultColors() {
        return {
            fills: POLYCHROMA_LIGHT_FILLS,
            strokes: POLYCHROMA_LIGHT_STROKES,
            up: { fill: POLYCHROMA_LIGHT_FILLS.BLUE, stroke: POLYCHROMA_LIGHT_STROKES.BLUE },
            down: { fill: POLYCHROMA_LIGHT_FILLS.RED, stroke: POLYCHROMA_LIGHT_STROKES.RED },
            neutral: { fill: POLYCHROMA_LIGHT_FILL_GRAY, stroke: POLYCHROMA_LIGHT_STROKE_GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [POLYCHROMA_LIGHT_FILLS.BLUE, POLYCHROMA_LIGHT_FILLS.RED]);

        params.set(DEFAULT_ANNOTATION_STROKE, POLYCHROMA_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, POLYCHROMA_LIGHT_FILLS.BLUE);

        return params;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
