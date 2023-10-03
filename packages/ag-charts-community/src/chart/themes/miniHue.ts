import type { AgChartThemePalette } from '../../options/agChartOptions';
import { ChartTheme } from './chartTheme';

const palette: AgChartThemePalette = {
    "fills": [
        "#3e69ea", 
        "#0084e8", 
        "#02a0d4", 
        "#01a79c", 
        "#01ad5c", 
        "#3ea800", 
        "#d1b500", 
        "#c77400", 
        "#d65505", 
        "#db3619" 
    ],
    "strokes": [
        "#1f40bf", 
        "#005dbe", 
        "#0079ab", 
        "#008077", 
        "#008637", 
        "#018100", 
        "#a28600", 
        "#9e4e00", 
        "#ab2a00", 
        "#ae0000" 
    ]
};

export class MiniHue extends ChartTheme {
    protected override getPalette(): AgChartThemePalette {
        return palette;
    }
}
