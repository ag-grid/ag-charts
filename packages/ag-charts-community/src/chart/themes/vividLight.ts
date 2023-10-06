import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    fills: [
        '#3f8fea',
        '#ff9900',
        '#2ea049',
        '#00c2eb',
        '#9a63d6',
        '#e4cc00',
        '#888888',
        '#c550ac',
        '#925f00',
        '#f94548',
    ],
    strokes: [
        '#0f68c0',
        '#d47100',
        '#007922',
        '#009ac2',
        '#753cac',
        '#bca400',
        '#646464',
        '#9b2685',
        '#6c3b00',
        '#cb0021',
    ],
};

export class VividLight extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
