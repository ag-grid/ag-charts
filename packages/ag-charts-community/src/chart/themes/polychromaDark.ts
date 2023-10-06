import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';

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
        '#6698ff',
        '#c0a3ff',
        '#fc8dfc',
        '#ff82b1',
        '#ff9b70',
        '#ffcf4e',
        '#ffff58',
        '#58dd70',
        '#51e2c9',
        '#4fd7ff',
    ],
};

export class PolychromaDark extends DarkTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
