import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

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
        '#0081ca',
        '#0094ac',
        '#007064',
        '#1d8828',
        '#c60000',
        '#bb0040',
        '#740088',
        '#47078e',
        '#222b8c',
        '#006fc8',
    ],
};

export class MaterialLight extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
