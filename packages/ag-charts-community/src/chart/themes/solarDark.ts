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
        '#6ef8ff',
        '#c8dfff',
        '#ffc8ff',
        '#ffbaff',
        '#ffb2ae',
        '#ffcb71',
        '#ffff70',
        '#c5fe84',
        '#72ffcf',
        '#73ffff',
    ],
};

export class SolarDark extends DarkTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
