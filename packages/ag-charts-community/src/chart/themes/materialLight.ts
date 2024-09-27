import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_COLOR,
    DEFAULT_DIVERGING_SERIES_COLOR_RANGE,
    DEFAULT_FUNNEL_SERIES_COLOR_RANGE,
    DEFAULT_GAUGE_SERIES_COLOR_RANGE,
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

export class MaterialLight extends ChartTheme {
    override getDefaultColors() {
        return {
            fills: MATERIAL_LIGHT_FILLS,
            strokes: MATERIAL_LIGHT_STROKES,
            up: { fill: MATERIAL_LIGHT_FILLS.GREEN, stroke: MATERIAL_LIGHT_STROKES.GREEN },
            down: { fill: MATERIAL_LIGHT_FILLS.RED, stroke: MATERIAL_LIGHT_STROKES.RED },
            neutral: { fill: MATERIAL_LIGHT_FILLS.GRAY, stroke: MATERIAL_LIGHT_STROKES.GRAY },
            altUp: { fill: MATERIAL_LIGHT_FILLS.BLUE, stroke: MATERIAL_LIGHT_STROKES.BLUE },
            altDown: { fill: MATERIAL_LIGHT_FILLS.RED, stroke: MATERIAL_LIGHT_STROKES.RED },
            altNeutral: { fill: MATERIAL_LIGHT_FILLS.GRAY, stroke: MATERIAL_LIGHT_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOR_RANGE, [
            MATERIAL_LIGHT_FILLS.ORANGE,
            MATERIAL_LIGHT_FILLS.YELLOW,
            MATERIAL_LIGHT_FILLS.GREEN,
        ]);
        params.set(DEFAULT_FUNNEL_SERIES_COLOR_RANGE, [
            '#2196f3', // 500
            '#329EF4', // (interpolated)
            '#42a5f5', // 400
            '#53ADF6', // (interpolated)
            '#64b5f6', // 300
            '#7AC0F8', // (interpolated)
            '#90caf9', // 200
        ]);
        params.set(DEFAULT_GAUGE_SERIES_COLOR_RANGE, [
            MATERIAL_LIGHT_FILLS.GREEN,
            MATERIAL_LIGHT_FILLS.YELLOW,
            MATERIAL_LIGHT_FILLS.RED,
        ]);

        params.set(DEFAULT_ANNOTATION_COLOR, MATERIAL_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, MATERIAL_LIGHT_FILLS.BLUE);

        return params;
    }
}
