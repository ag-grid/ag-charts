import type { AgChartThemeOptions, AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_INSIDE_SERIES_LABEL_COLOUR,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
    DEFAULT_WATERFALL_NEGATIVE,
} from './symbols';

const palette: AgChartThemePalette = {
    fills: [
        '#4F81BD',
        '#F79646',
        '#468A51',
        '#4BACC6',
        '#CDBC21',
        '#8460AF',
        '#7B7B7B',
        '#A55492',
        '#73572E',
        '#D3504D',
    ],
    strokes: [
        '#74a8e6',
        '#ffbe70',
        '#6cb176',
        '#75d4ef',
        '#f6e559',
        '#aa86d8',
        '#a1a1a1',
        '#ce7ab9',
        '#997b52',
        '#ff7872',
    ],
};

export class DarkTheme extends ChartTheme {
    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(DEFAULT_LABEL_COLOUR, 'white');
        result.properties.set(DEFAULT_MUTED_LABEL_COLOUR, '#7D91A0');
        result.properties.set(DEFAULT_WATERFALL_NEGATIVE, 'red');
        result.properties.set(DEFAULT_AXIS_GRID_COLOUR, '#545A6E');
        result.properties.set(DEFAULT_BACKGROUND_COLOUR, '#15181c');
        result.properties.set(DEFAULT_INSIDE_SERIES_LABEL_COLOUR, '#15181c');
        result.properties.set(DEFAULT_TREEMAP_TILE_BORDER_COLOUR, 'white');

        return result;
    }

    protected override getPalette(): AgChartThemePalette {
        return palette;
    }

    constructor(options?: AgChartThemeOptions) {
        super(options);
    }
}
