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
        '#72ebff',
        '#b5c1ff',
        '#ffa5ff',
        '#ff92ec',
        '#ff938b',
        '#ffac5f',
        '#fff56c',
        '#9bf162',
        '#6effbd',
        '#79ffff',
    ],
};

export class VividDark extends DarkTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
