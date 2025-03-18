import type { AgColorType, AgColorTypeStrict } from '../series/cartesian/commonOptions';
import type { CssColor } from './types';

export type AgChartThemeName =
    | 'ag-default'
    | 'ag-default-dark'
    | 'ag-sheets'
    | 'ag-sheets-dark'
    | 'ag-polychroma'
    | 'ag-polychroma-dark'
    | 'ag-vivid'
    | 'ag-vivid-dark'
    | 'ag-material'
    | 'ag-material-dark'
    | 'ag-financial'
    | 'ag-financial-dark';

export interface AgPaletteColors {
    fill?: AgColorTypeStrict;
    stroke?: CssColor;
}

/**
 * Palette used by the chart instance.
 */
export interface AgChartThemePalette {
    /** The array of fills to be used. */
    fills?: AgColorType[];
    /** The array of strokes to be used. */
    strokes?: CssColor[];
    up?: AgPaletteColors;
    down?: AgPaletteColors;
    neutral?: AgPaletteColors;
}
