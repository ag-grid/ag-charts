import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    "fills": [
        "#4F81BD",
        "#F79646",
        "#468A50",
        "#4BACC6",
        "#D3504D",
        "#6D9F41",
        "#7B7B7B",
        "#A55492",
        "#73572E",
        "#8460AF",
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

export class Enterprise001 extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
