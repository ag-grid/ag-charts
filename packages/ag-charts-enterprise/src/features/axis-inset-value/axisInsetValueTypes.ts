import type { AgCartesianAxisPosition, AgCssColorOrRef, TextOptions } from 'ag-charts-types';

export interface AxisInsetValueLabelFormatterParams {
    /** The category the block belongs to, as read from `categoryKey`. */
    readonly category: unknown;
    /** The block's value, as read from `valueKey`. */
    readonly value: number;
    /** The datum the category and value were read from. */
    readonly datum: any;
}

export interface AxisInsetValueLabelOptions extends TextOptions {
    enabled?: boolean;
    /** Space kept clear either side of the text, in pixels. */
    padding?: number;
    formatter?: (params: AxisInsetValueLabelFormatterParams) => string;
}

/**
 * Internal options of the `axisInsetValue` axis plugin; presets fill them in on a category axis.
 */
export interface AxisInsetValueOptions {
    enabled?: boolean;
    /** The side of the series area the strip is reserved on. */
    position?: AgCartesianAxisPosition;
    /** Strip thickness in pixels. Default: just wide enough for the widest label. */
    width?: number;
    /** Least strip thickness in pixels when `width` is not given. Default: `60` */
    minWidth?: number;
    fill?: AgCssColorOrRef;
    fillOpacity?: number;
    /** Datum key holding the axis category each block belongs to. */
    categoryKey?: string;
    /** Datum key holding the numeric value each block shows. */
    valueKey?: string;
    label?: AxisInsetValueLabelOptions;
}
