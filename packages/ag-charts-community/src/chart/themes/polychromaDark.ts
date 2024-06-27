import type { AgChartThemePalette } from 'ag-charts-types';

import { DarkTheme } from './darkTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
} from './symbols';

const POLYCHROMA_DARK_FILLS = {
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

const POLYCHROMA_DARK_STROKES = {
    BLUE: '#6698ff',
    PURPLE: '#c0a3ff',
    MAGENTA: '#fc8dfc',
    PINK: '#ff82b1',
    RED: '#ff9b70',
    ORANGE: '#ffcf4e',
    YELLOW: '#ffff58',
    GREEN: '#58dd70',
    CYAN: '#51e2c9',
    MODERATE_BLUE: '#4fd7ff',
};

const POLYCHROMA_DARK_FILL_GRAY = '#bbbbbb';
const POLYCHROMA_DARK_STROKE_GRAY = '#eeeeee';

const palette: AgChartThemePalette = {
    fills: Object.values(POLYCHROMA_DARK_FILLS),
    strokes: Object.values(POLYCHROMA_DARK_STROKES),
};

export class PolychromaDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: POLYCHROMA_DARK_FILLS,
            strokes: POLYCHROMA_DARK_STROKES,
            up: { fill: POLYCHROMA_DARK_FILLS.BLUE, stroke: POLYCHROMA_DARK_STROKES.BLUE },
            down: { fill: POLYCHROMA_DARK_FILLS.RED, stroke: POLYCHROMA_DARK_STROKES.RED },
            neutral: { fill: POLYCHROMA_DARK_FILL_GRAY, stroke: POLYCHROMA_DARK_STROKE_GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [POLYCHROMA_DARK_FILLS.BLUE, POLYCHROMA_DARK_FILLS.RED]);

        params.set(DEFAULT_ANNOTATION_STROKE, POLYCHROMA_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, POLYCHROMA_DARK_FILLS.BLUE);

        return params;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
