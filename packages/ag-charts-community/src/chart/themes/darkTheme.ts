import type { AgChartThemeOptions } from 'ag-charts-types';

import { ChartTheme } from './chartTheme';
import type { DefaultColors } from './defaultColors';
import {
    DEFAULT_ANNOTATION_BACKGROUND_FILL,
    DEFAULT_ANNOTATION_COLOR,
    DEFAULT_ANNOTATION_HANDLE_FILL,
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_CROSS_LINES_COLOUR,
    DEFAULT_DIVERGING_SERIES_COLOUR_RANGE,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_HIERARCHY_STROKES,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_POLAR_SERIES_STROKE,
    DEFAULT_TEXTBOX_COLOR,
    DEFAULT_TEXTBOX_FILL,
    DEFAULT_TEXTBOX_STROKE,
    DEFAULT_TEXT_ANNOTATION_COLOR,
    IS_DARK_THEME,
} from './symbols';

// If this changes, update plugins/ag-charts-generate-chart-thumbnail/src/executors/generate/generator/constants.ts
const DEFAULT_DARK_BACKGROUND_FILL = '#192232';

const DEFAULT_DARK_FILLS = {
    BLUE: '#5090dc',
    ORANGE: '#ffa03a',
    GREEN: '#459d55',
    CYAN: '#34bfe1',
    YELLOW: '#e1cc00',
    VIOLET: '#9669cb',
    GRAY: '#b5b5b5',
    MAGENTA: '#bd5aa7',
    BROWN: '#8a6224',
    RED: '#ef5452',
};

const DEFAULT_DARK_STROKES = {
    BLUE: '#74a8e6',
    ORANGE: '#ffbe70',
    GREEN: '#6cb176',
    CYAN: '#75d4ef',
    YELLOW: '#f6e559',
    VIOLET: '#aa86d8',
    GRAY: '#a1a1a1',
    MAGENTA: '#ce7ab9',
    BROWN: '#997b52',
    RED: '#ff7872',
};

export class DarkTheme extends ChartTheme {
    override getDefaultColors(): DefaultColors {
        return {
            fills: DEFAULT_DARK_FILLS,
            strokes: DEFAULT_DARK_STROKES,
            up: { fill: DEFAULT_DARK_FILLS.GREEN, stroke: DEFAULT_DARK_STROKES.GREEN },
            down: { fill: DEFAULT_DARK_FILLS.RED, stroke: DEFAULT_DARK_STROKES.RED },
            neutral: { fill: DEFAULT_DARK_FILLS.GRAY, stroke: DEFAULT_DARK_STROKES.GRAY },
            altUp: { fill: DEFAULT_DARK_FILLS.BLUE, stroke: DEFAULT_DARK_STROKES.BLUE },
            altDown: { fill: DEFAULT_DARK_FILLS.ORANGE, stroke: DEFAULT_DARK_STROKES.ORANGE },
            altNeutral: { fill: DEFAULT_DARK_FILLS.GRAY, stroke: DEFAULT_DARK_STROKES.GRAY },
        };
    }

    override getTemplateParameters() {
        const params = super.getTemplateParameters();

        params.set(IS_DARK_THEME, true);
        params.set(DEFAULT_POLAR_SERIES_STROKE, DEFAULT_DARK_BACKGROUND_FILL);

        params.set(DEFAULT_LABEL_COLOUR, 'white');
        params.set(DEFAULT_MUTED_LABEL_COLOUR, '#7D91A0');
        params.set(DEFAULT_AXIS_GRID_COLOUR, '#545A6E');
        params.set(DEFAULT_CROSS_LINES_COLOUR, 'white');
        params.set(DEFAULT_DIVERGING_SERIES_COLOUR_RANGE, [
            DEFAULT_DARK_FILLS.ORANGE,
            DEFAULT_DARK_FILLS.YELLOW,
            DEFAULT_DARK_FILLS.GREEN,
        ]);
        params.set(DEFAULT_HIERARCHY_FILLS, ['#192834', '#253746', '#324859', '#3f596c', '#4d6a80']);
        params.set(DEFAULT_HIERARCHY_STROKES, ['#192834', '#3b5164', '#496275', '#577287', '#668399']);
        params.set(DEFAULT_BACKGROUND_COLOUR, DEFAULT_DARK_BACKGROUND_FILL);
        params.set(DEFAULT_INSIDE_SERIES_LABEL_COLOUR, DEFAULT_DARK_BACKGROUND_FILL);

        params.set(DEFAULT_ANNOTATION_COLOR, 'white');
        params.set(DEFAULT_TEXT_ANNOTATION_COLOR, DEFAULT_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_BACKGROUND_FILL, DEFAULT_DARK_FILLS.BLUE);
        params.set(DEFAULT_ANNOTATION_HANDLE_FILL, DEFAULT_DARK_BACKGROUND_FILL);

        params.set(DEFAULT_TEXTBOX_FILL, '#28313e');
        params.set(DEFAULT_TEXTBOX_STROKE, '#4b525d');
        params.set(DEFAULT_TEXTBOX_COLOR, '#ffffff');

        return params;
    }

    constructor(options?: AgChartThemeOptions) {
        super(options);
    }
}
