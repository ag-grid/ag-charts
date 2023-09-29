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
        '#6bebff',
        '#70feff',
        '#63d6c6',
        '#8ef18f',
        '#ff8a75',
        '#ff709f',
        '#de6df3',
        '#a179fb',
        '#758ff9',
        '#6dd7ff',
    ],
};

export class MaterialDark extends DarkTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
