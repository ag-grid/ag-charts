import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    "fills": [
        "#4472C4",
        "#ED7D31",
        "#A5A5A5",
        "#FFC000",
        "#5B9BD5",
        "#70AD47",
        "#7B7B7B",
        "#264478",
        "#636363",
        "#997300",
      ],
    "strokes": [
        '#23558d',
        '#bf6100',
        '#5e7b11',
        '#008087',
        '#a42026',
        '#1b6b2e',
        '#5b3980',
        '#563700',
        '#752865',
        '#626262',
      ]
};

export class Excel extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
