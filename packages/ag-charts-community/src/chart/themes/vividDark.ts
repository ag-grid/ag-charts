import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';

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
        '#67b7ff',
        '#ffc24d',
        '#5cc86f',
        '#54ebff',
        '#c18aff',
        '#fff653',
        '#aeaeae',
        '#f078d4',
        '#ba8438',
        '#ff726e',
    ],
};

export class VividDark extends DarkTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
