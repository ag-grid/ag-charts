import { DarkTheme } from './darkTheme';
import type { AgChartThemePalette } from '../../options/agChartOptions';

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
        '#0095dd',
        '#6d7fdd',
        '#a869d3',
        '#cd5b9f',
        '#d15154',
        '#d16b00',
        '#b58d00',
        '#689c14',
        '#00a872',
        '#00a5b4',
    ],
};

export class SolarDark extends DarkTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
