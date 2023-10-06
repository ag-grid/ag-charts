import type { AgChartThemeOptions, AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';
import {
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
} from './symbols';

const palette: AgChartThemePalette = {
    fills: [
        '#4F81BD',
        '#F79646',
        '#468A51',
        '#4BACC6',
        '#8460AF',
        '#CDBC21',
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
        '#aa86d8',
        '#f6e559',
        '#a1a1a1',
        '#ce7ab9',
        '#997b52',
        '#ff7872',
    ],
};

export class DarkTheme extends ChartTheme {
    protected override getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(DEFAULT_LABEL_COLOUR, 'rgb(200, 200, 200)');
        result.properties.set(DEFAULT_MUTED_LABEL_COLOUR, 'rgb(150, 150, 150)');
        result.properties.set(DEFAULT_AXIS_GRID_COLOUR, 'rgb(88, 88, 88)');
        result.properties.set(DEFAULT_BACKGROUND_COLOUR, 'rgb(34, 38, 41)');
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
