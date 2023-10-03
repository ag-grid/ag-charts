import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    fills: [
        '#436ff4',
        '#f2a602',
        '#9a7bff',
        '#e9e201',
        '#d165d2',
        '#21b448',
        '#f0598b',
        '#00b9a2',
        '#f47348',
        '#00aee4',
    ],
    strokes: [
        '#132baf',
        '#a55f00',
        '#623bba',
        '#8f8500',
        '#8f2291',
        '#007500',
        '#a90352',
        '#007762',
        '#ae3200',
        '#006fa3',
    ],
};

export class DeOrdered extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
