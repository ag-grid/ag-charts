import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    fills: [
        '#4472C4',
        '#ED7D31',
        '#A5A5A5',
        '#FFC000',
        '#5B9BD5',
        '#70AD47',
        '#7B7B7B',
        '#264478',
        '#636363',
        '#997300',
    ],
    strokes: [
        '#214d9b',
        '#c25600',
        '#7f7f7f',
        '#d59800',
        '#3575ac',
        '#4b861a',
        '#575757',
        '#062253',
        '#414141',
        '#734f00',
    ],
};

export class Excel extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
