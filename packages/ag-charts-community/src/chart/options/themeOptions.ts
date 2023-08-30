import type { AgAreaSeriesOptions } from '../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../series/cartesian/barOptions';
import type { AgCartesianSeriesTheme, AgCartesianThemeOptions } from '../series/cartesian/cartesianOptions';
import type { AgHistogramSeriesOptions } from '../series/cartesian/histogramOptions';
import type { AgLineSeriesOptions } from '../series/cartesian/lineOptions';
import type { AgScatterSeriesOptions } from '../series/cartesian/scatterOptions';
import type {
    AgHierarchySeriesOptions,
    AgHierarchySeriesTheme,
    AgHierarchyThemeOptions,
} from '../series/hierarchy/hierarchyOptions';
import type { AgPieSeriesOptions } from '../series/polar/pieOptions';
import type { AgPolarSeriesTheme, AgPolarThemeOptions } from '../series/polar/polarOptions';

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

export interface AgChartThemeOverrides {
    /** Specifies defaults for all cartesian charts (used for bar, column, histogram, line, scatter and area series) */
    cartesian?: AgCartesianThemeOptions<AgCartesianSeriesTheme>;
    /** Specifies defaults for bar charts. */
    bar?: AgCartesianThemeOptions<AgBarSeriesOptions>;
    /** Specifies defaults for line charts. */
    line?: AgCartesianThemeOptions<AgLineSeriesOptions>;
    /** Specifies defaults for area charts. */
    area?: AgCartesianThemeOptions<AgAreaSeriesOptions>;
    /** Specifies defaults for scatter/bubble charts. */
    scatter?: AgCartesianThemeOptions<AgScatterSeriesOptions>;
    /** Specifies defaults for histogram charts. */
    histogram?: AgCartesianThemeOptions<AgHistogramSeriesOptions>;

    /** Specifies defaults for all polar charts (used for pie series) */
    polar?: AgPolarThemeOptions<AgPolarSeriesTheme>;
    /** Specifies defaults for pie/doughnut charts. */
    pie?: AgPolarThemeOptions<AgPieSeriesOptions>;

    /** Specifies defaults for all hierarchy charts (used for treemap series) */
    hierarchy?: AgHierarchyThemeOptions<AgHierarchySeriesTheme>;
    /** Specifies defaults for all treemap charts. */
    treemap?: AgHierarchyThemeOptions<AgHierarchySeriesOptions>;

    /** Specifies defaults for all chart types. Be careful to only use properties that apply to all chart types here. For example, don't specify `navigator` configuration here as navigators are only available in cartesian charts. */
    common?: any;
}
