import type { AgChartThemePalette } from '../../options/chart/themeOptions';
import { DarkTheme } from './darkTheme';

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
        '#b7ffff',
        '#e1ffff',
        '#fff1ff',
        '#ffe7ff',
        '#ffe5eb',
        '#ffedc2',
        '#ffffb7',
        '#ffffbc',
        '#c5ffe6',
        '#a9ffff',
    ],
};

export class PastelDark extends DarkTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
