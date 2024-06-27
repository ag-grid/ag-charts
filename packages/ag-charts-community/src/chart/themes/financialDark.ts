import type { AgChartThemePalette } from 'ag-charts-types';

import { DarkTheme } from './darkTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_STROKE,
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_CAPTION_ALIGNMENT,
    DEFAULT_CAPTION_LAYOUT_STYLE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_GRIDLINE_ENABLED,
    DEFAULT_PADDING,
    DEFAULT_TOOLBAR_POSITION,
} from './symbols';

const FINANCIAL_DARK_FILLS = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

const FINANCIAL_DARK_STROKES = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

const palette: AgChartThemePalette = {
    fills: Object.values(FINANCIAL_DARK_FILLS),
    strokes: Object.values(FINANCIAL_DARK_STROKES),
};

export class FinancialDark extends DarkTheme {
    override getDefaultColors() {
        return {
            fills: { ...FINANCIAL_DARK_FILLS },
            strokes: { ...FINANCIAL_DARK_STROKES },
            up: { fill: FINANCIAL_DARK_FILLS.GREEN, stroke: FINANCIAL_DARK_STROKES.GREEN },
            down: { fill: FINANCIAL_DARK_FILLS.RED, stroke: FINANCIAL_DARK_STROKES.RED },
            neutral: { fill: FINANCIAL_DARK_FILLS.BLUE, stroke: FINANCIAL_DARK_STROKES.BLUE },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            FINANCIAL_DARK_FILLS.GREEN,
            FINANCIAL_DARK_FILLS.BLUE,
            FINANCIAL_DARK_FILLS.RED,
        ]);

        params.set(DEFAULT_ANNOTATION_STROKE, FINANCIAL_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, FINANCIAL_DARK_FILLS.BLUE);
        params.set(DEFAULT_AXIS_GRID_COLOUR, '#343A4E');

        params.set(DEFAULT_PADDING, 0);
        params.set(DEFAULT_CAPTION_LAYOUT_STYLE, 'overlay');
        params.set(DEFAULT_CAPTION_ALIGNMENT, 'left');
        params.set(DEFAULT_TOOLBAR_POSITION, 'bottom');
        params.set(DEFAULT_GRIDLINE_ENABLED, true);

        return params;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
