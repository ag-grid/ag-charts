import type { AgChartThemeOptions } from '../../options/agChartOptions';
import type { AgChartThemePalette } from '../../options/chart/themeOptions';
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
        '#436ff4',
        '#9a7bff',
        '#d165d2',
        '#f0598b',
        '#f47348',
        '#f2a602',
        '#e9e201',
        '#21b448',
        '#00b9a2',
        '#00aee4',
    ],
    strokes: [
        '#7cb0ff',
        '#d8bcff',
        '#ffa5ff',
        '#ff9bc9',
        '#ffb488',
        '#ffe86b',
        '#ffff76',
        '#73f688',
        '#6efbe2',
        '#6cf0ff',
    ],
};

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

    protected getPalette(): AgChartThemePalette {
        return palette;
    }

    constructor(options?: AgChartThemeOptions) {
        super(options);
    }
}
