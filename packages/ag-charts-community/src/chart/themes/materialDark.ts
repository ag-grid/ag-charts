import { DarkTheme } from './darkTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_COLOR,
    DEFAULT_DIVERGING_SERIES_COLOR_RANGE,
    DEFAULT_FUNNEL_SERIES_COLOR_RANGE,
    DEFAULT_GAUGE_SERIES_COLOR_RANGE,
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

export class MaterialDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: MATERIAL_DARK_FILLS,
            strokes: MATERIAL_DARK_STROKES,
            up: { fill: MATERIAL_DARK_FILLS.GREEN, stroke: MATERIAL_DARK_STROKES.GREEN },
            down: { fill: MATERIAL_DARK_FILLS.RED, stroke: MATERIAL_DARK_STROKES.RED },
            neutral: { fill: MATERIAL_DARK_FILLS.GRAY, stroke: MATERIAL_DARK_STROKES.GRAY },
            altUp: { fill: MATERIAL_DARK_FILLS.BLUE, stroke: MATERIAL_DARK_STROKES.BLUE },
            altDown: { fill: MATERIAL_DARK_FILLS.RED, stroke: MATERIAL_DARK_STROKES.RED },
            altNeutral: { fill: MATERIAL_DARK_FILLS.GRAY, stroke: MATERIAL_DARK_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOR_RANGE, [
            MATERIAL_DARK_FILLS.ORANGE,
            MATERIAL_DARK_FILLS.YELLOW,
            MATERIAL_DARK_FILLS.GREEN,
        ]);
        params.set(DEFAULT_FUNNEL_SERIES_COLOR_RANGE, [
            '#2196f3', // 500
            '#208FEC', // (interpolated)
            '#1E88E5', // 600
            '#1C7FDC', // (interpolated)
            '#1976d2', // 700
            '#176EC9', // (interpolated)
            '#1565c0', // 800
        ]);
        params.set(DEFAULT_GAUGE_SERIES_COLOR_RANGE, [
            MATERIAL_DARK_FILLS.GREEN,
            MATERIAL_DARK_FILLS.YELLOW,
            MATERIAL_DARK_FILLS.RED,
        ]);

        params.set(DEFAULT_ANNOTATION_COLOR, MATERIAL_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, MATERIAL_DARK_FILLS.BLUE);

        return params;
    }
}
