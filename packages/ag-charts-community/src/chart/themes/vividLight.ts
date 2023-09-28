import { ChartTheme } from './chartTheme';
import type { AgChartThemePalette } from '../../options/agChartOptions';

const palette: AgChartThemePalette = {
    fills: [
        '#1fa9ff',
        '#7a80ff',
        '#c364f2',
        '#ef4eab',
        '#ff4d4d',
        '#ef6b00',
        '#e9b301',
        '#5caf00',
        '#00bd7f',
        '#05d5f5',
    ],
    strokes: [
        '#005eae',
        '#4640ba',
        '#841caf',
        '#a8006e',
        '#b60008',
        '#a92700',
        '#9b6900',
        '#1b7000',
        '#007e45',
        '#008aa8',
    ],
};

export class VividLight extends ChartTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
