import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    "fills": [
        "#4F81BD",
        "#F2903F",
        "#4D9859",
        "#43AEB5",
        "#D85451",
        "#89A949",
        "#8664AF",
        "#82602E",
        "#A55492",
        "#8E8E8E",
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

export class Enter extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
