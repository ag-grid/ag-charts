import { ChartTheme } from './chartTheme';
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
        '#00588b',
        '#006676',
        '#004d44',
        '#135d1b',
        '#890003',
        '#81002b',
        '#4f005d',
        '#2f0761',
        '#161d60',
        '#004c8a',
    ],
};

export class MaterialLight extends ChartTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
