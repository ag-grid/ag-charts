import { ChartTheme } from './chartTheme';
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
        '#318cb3',
        '#667fbc',
        '#8c73b4',
        '#a96997',
        '#b6676e',
        '#b16f47',
        '#a19505',
        '#7b9534',
        '#449469',
        '#0d9593',
    ],
};

export class PastelLight extends ChartTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
