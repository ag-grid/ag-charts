import { DarkTheme } from './darkTheme';
import type { AgChartThemePalette } from '../../options/agChartOptions';

const palette: AgChartThemePalette = {
    fills: [
        '#75cbf4',
        '#a1beff',
        '#cbb0f6',
        '#eaa6d6',
        '#f9a4ab',
        '#f4ac83',
        '#f2e773',
        '#bedb7b',
        '#84d3a6',
        '#65d4d2',
    ],
    strokes: [
        '#54abd3',
        '#839edd',
        '#ab91d5',
        '#c987b6',
        '#d7858c',
        '#d28d65',
        '#c0b43c',
        '#99b455',
        '#64b387',
        '#41b4b2',
    ],
};

export class PastelDark extends DarkTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
