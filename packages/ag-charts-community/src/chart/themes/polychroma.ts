import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    fills: [
        '#436ff4',
        '#9a7bff',
        '#d165d2',
        '#f0598b',
        '#f47348',
        '#f2a602',
        '#e9e201',
        '#21b448',
        '#00b9a2',
        '#00aee4',
    ],
    strokes: [
        '#2346c9',
        '#7653d4',
        '#a73da9',
        '#c32d66',
        '#c84b1c',
        '#c87f00',
        '#c1b900',
        '#008c1c',
        '#00927c',
        '#0087bb',
    ],
};

export class Polychroma extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
