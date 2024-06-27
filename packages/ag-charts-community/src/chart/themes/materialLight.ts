import type { AgChartThemePalette } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
} from './symbols';

const MATERIAL_LIGHT_FILLS = {
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

const MATERIAL_LIGHT_STROKES = {
    BLUE: '#1565C0',
    ORANGE: '#E65100',
    GREEN: '#2E7D32',
    CYAN: '#00838F',
    YELLOW: '#F9A825',
    VIOLET: '#4527A0',
    GRAY: '#616161',
    MAGENTA: '#C2185B',
    BROWN: '#4E342E',
    RED: '#B71C1C',
};

const palette: AgChartThemePalette = {
    fills: Object.values(MATERIAL_LIGHT_FILLS),
    strokes: Object.values(MATERIAL_LIGHT_STROKES),
};

export class MaterialLight extends ChartTheme {
    override getDefaultColors() {
        return {
            fills: MATERIAL_LIGHT_FILLS,
            strokes: MATERIAL_LIGHT_STROKES,
            up: { fill: MATERIAL_LIGHT_FILLS.BLUE, stroke: MATERIAL_LIGHT_STROKES.BLUE },
            down: { fill: MATERIAL_LIGHT_FILLS.RED, stroke: MATERIAL_LIGHT_STROKES.RED },
            neutral: { fill: MATERIAL_LIGHT_FILLS.GRAY, stroke: MATERIAL_LIGHT_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            MATERIAL_LIGHT_FILLS.ORANGE,
            MATERIAL_LIGHT_FILLS.YELLOW,
            MATERIAL_LIGHT_FILLS.GREEN,
        ]);

        params.set(DEFAULT_ANNOTATION_STROKE, MATERIAL_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, MATERIAL_LIGHT_FILLS.BLUE);

        return params;
    }
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
