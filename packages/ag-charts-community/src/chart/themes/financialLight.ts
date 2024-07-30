import { ChartTheme } from './chartTheme';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_COLOR,
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_CAPTION_ALIGNMENT,
    DEFAULT_CAPTION_LAYOUT_STYLE,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_GRIDLINE_ENABLED,
    DEFAULT_PADDING,
    DEFAULT_TOOLBAR_POSITION,
} from './symbols';

const FINANCIAL_LIGHT_FILLS = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

const FINANCIAL_LIGHT_STROKES = {
    GREEN: '#089981',
    RED: '#F23645',
    BLUE: '#5090dc',
};

export class FinancialLight extends ChartTheme {
    override getDefaultColors() {
        return {
            fills: { ...FINANCIAL_LIGHT_FILLS },
            strokes: { ...FINANCIAL_LIGHT_STROKES },
            up: { fill: FINANCIAL_LIGHT_FILLS.GREEN, stroke: FINANCIAL_LIGHT_STROKES.GREEN },
            down: { fill: FINANCIAL_LIGHT_FILLS.RED, stroke: FINANCIAL_LIGHT_STROKES.RED },
            neutral: { fill: FINANCIAL_LIGHT_FILLS.BLUE, stroke: FINANCIAL_LIGHT_STROKES.BLUE },
            altUp: { fill: FINANCIAL_LIGHT_FILLS.GREEN, stroke: FINANCIAL_LIGHT_STROKES.GREEN },
            altDown: { fill: FINANCIAL_LIGHT_FILLS.RED, stroke: FINANCIAL_LIGHT_STROKES.RED },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            FINANCIAL_LIGHT_FILLS.GREEN,
            FINANCIAL_LIGHT_FILLS.BLUE,
            FINANCIAL_LIGHT_FILLS.RED,
        ]);

        params.set(DEFAULT_ANNOTATION_COLOR, FINANCIAL_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, FINANCIAL_LIGHT_FILLS.BLUE);
        params.set(DEFAULT_AXIS_GRID_COLOUR, '#F2F3F3');

        params.set(DEFAULT_PADDING, 0);
        params.set(DEFAULT_CAPTION_LAYOUT_STYLE, 'overlay');
        params.set(DEFAULT_CAPTION_ALIGNMENT, 'left');
        params.set(DEFAULT_TOOLBAR_POSITION, 'bottom');
        params.set(DEFAULT_GRIDLINE_ENABLED, true);

        return params;
    }
}
