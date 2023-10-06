import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';

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
        '#4ed2ff',
        '#52e5fe',
        '#47bdae',
        '#75d877',
        '#ff705e',
        '#ff5588',
        '#c554d9',
        '#8a62e1',
        '#6077df',
        '#53beff',
    ],
};

export class MaterialDark extends DarkTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
