import type { AgChartThemePalette } from '../../options/chart/themeOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    fills: [
        '#00b5ff',
        '#8a9eff',
        '#c888f5',
        '#f07abe',
        '#f47171',
        '#f38a25',
        '#e7be08',
        '#86bc40',
        '#00c890',
        '#00c5d4',
    ],
    strokes: [
        '#0076bc',
        '#5261bc',
        '#894ab2',
        '#ab3c81',
        '#ae3038',
        '#af4c00',
        '#966f00',
        '#4b7d00',
        '#008955',
        '#008695',
    ],
};

export class SolarLight extends ChartTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
