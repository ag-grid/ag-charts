import { DarkTheme } from './darkTheme';
import type { AgChartThemePalette } from '../../options/agChartOptions';

const palette: AgChartThemePalette = {
    fills: [
        '#03a9f4',
        '#00bcd4',
        '#009688',
        '#4caf50',
        '#f44336',
        '#e91e63',
        '#9c27b0',
        '#673ab7',
        '#3f51b5',
        '#2196f3',
    ],
    strokes: [
        '#0276ab',
        '#008494',
        '#00695f',
        '#357a38',
        '#ab2f26',
        '#a31545',
        '#6d1b7b',
        '#482980',
        '#2c397f',
        '#1769aa',
    ],
};

export class MaterialDark extends DarkTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
