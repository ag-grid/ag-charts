import type { AgChartThemeOptions } from '../agChartOptions';
import {
    ChartTheme,
    DEFAULT_AXIS_GRID_COLOUR,
    DEFAULT_BACKGROUND_COLOUR,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
    DEFAULT_TREEMAP_TILE_BORDER_COLOUR,
} from './chartTheme';

export class DarkTheme extends ChartTheme {
    protected getTemplateParameters() {
        const result = super.getTemplateParameters();

        result.properties.set(DEFAULT_LABEL_COLOUR, 'rgb(200, 200, 200)');
        result.properties.set(DEFAULT_MUTED_LABEL_COLOUR, 'rgb(150, 150, 150)');
        result.properties.set(DEFAULT_AXIS_GRID_COLOUR, 'rgb(88, 88, 88)');
        result.properties.set(DEFAULT_BACKGROUND_COLOUR, 'rgb(34, 38, 41)');
        result.properties.set(DEFAULT_TREEMAP_TILE_BORDER_COLOUR, 'white');

        return result;
    }

    constructor(options?: AgChartThemeOptions) {
        super(options);
    }
}
