import type { AgChartThemePalette } from 'ag-charts-types';

import { DarkTheme } from './darkTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
} from './symbols';

const MATERIAL_DARK_FILLS = {
    BLUE: '#2196F3',
    ORANGE: '#FF9800',
    GREEN: '#4CAF50',
    CYAN: '#00BCD4',
    YELLOW: '#FFEB3B',
    VIOLET: '#7E57C2',
    GRAY: '#9E9E9E',
    MAGENTA: '#F06292',
    BROWN: '#795548',
    RED: '#F44336',
};

const MATERIAL_DARK_STROKES = {
    BLUE: '#90CAF9',
    ORANGE: '#FFCC80',
    GREEN: '#A5D6A7',
    CYAN: '#80DEEA',
    YELLOW: '#FFF9C4',
    VIOLET: '#B39DDB',
    GRAY: '#E0E0E0',
    MAGENTA: '#F48FB1',
    BROWN: '#A1887F',
    RED: '#EF9A9A',
};

const palette: AgChartThemePalette = {
    fills: Object.values(MATERIAL_DARK_FILLS),
    strokes: Object.values(MATERIAL_DARK_STROKES),
};

export class MaterialDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: MATERIAL_DARK_FILLS,
            strokes: MATERIAL_DARK_STROKES,
            up: { fill: MATERIAL_DARK_FILLS.BLUE, stroke: MATERIAL_DARK_STROKES.BLUE },
            down: { fill: MATERIAL_DARK_FILLS.RED, stroke: MATERIAL_DARK_STROKES.RED },
            neutral: { fill: MATERIAL_DARK_FILLS.GRAY, stroke: MATERIAL_DARK_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            MATERIAL_DARK_FILLS.ORANGE,
            MATERIAL_DARK_FILLS.YELLOW,
            MATERIAL_DARK_FILLS.GREEN,
        ]);

        params.set(DEFAULT_ANNOTATION_STROKE, MATERIAL_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, MATERIAL_DARK_FILLS.BLUE);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
