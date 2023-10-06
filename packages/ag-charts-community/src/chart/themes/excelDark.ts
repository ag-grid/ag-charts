import type { AgChartThemePalette } from '../../options/agChartOptions';
import { DarkTheme } from './darkTheme';

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
        '#6899ee',
        '#ffa55d',
        '#cdcdcd',
        '#ffea53',
        '#82c3ff',
        '#96d56f',
        '#a1a1a1',
        '#47689f',
        '#878787',
        '#c0993d',
    ],
};

export class ExcelDark extends DarkTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
