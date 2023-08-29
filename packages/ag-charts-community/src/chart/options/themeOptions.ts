import type { AgCartesianSeriesOptions } from '../series/cartesian/cartesianOptions';
import type { AgHierarchySeriesOptions } from '../series/hierarchy/hierarchyOptions';
import type { AgPolarSeriesOptions } from '../series/polar/polarOptions';

export type AgChartThemeName =
    | 'ag-default'
    | 'ag-default-dark'
    | 'ag-material'
    | 'ag-material-dark'
    | 'ag-pastel'
    | 'ag-pastel-dark'
    | 'ag-solar'
    | 'ag-solar-dark'
    | 'ag-vivid'
    | 'ag-vivid-dark';

export interface AgChartThemePalette {
    /** The array of fills to be used. */
    fills: string[];
    /** The array of strokes to be used. */
    strokes: string[];
}

export interface AgChartThemeOptions {
    /** The palette to use. If specified, this replaces the palette from the base theme. */
    palette?: AgChartThemePalette;
    /** Configuration from this object is merged over the defaults specified in the base theme. */
    overrides?: AgChartThemeOverrides;
}

/** This object is used to define the configuration for a custom chart theme. */
export interface AgChartTheme extends AgChartThemeOptions {
    /**
     * The name of the theme to base your theme on. Your custom theme will inherit all of the configuration from
     * the base theme, allowing you to override just the settings you wish to change using the `overrides` config (see
     * below).
     */
    baseTheme?: AgChartThemeName;
}

type SeriesOptionTypes = AgCartesianSeriesOptions | AgPolarSeriesOptions | AgHierarchySeriesOptions;
export type AgChartThemeOverrides = {
    [K in NonNullable<SeriesOptionTypes['type']>]: SeriesOptionTypes & { type: K };
};
