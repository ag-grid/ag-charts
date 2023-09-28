import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';

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
        '#007dcf',
        '#5f60dc',
        '#a343d0',
        '#cb278c',
        '#da232e',
        '#cc4a00',
        '#bb8700',
        '#3d8f00',
        '#009d61',
        '#00a9c8',
    ],
};

export class VividDark extends DarkTheme {
    protected getPalette(): AgChartThemePalette {
        return palette;
    }
}
