import type { AgAreaSeriesOptions } from '../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../series/cartesian/barOptions';
import type { AgCartesianSeriesTheme, AgBaseCartesianThemeOptions } from '../series/cartesian/cartesianOptions';
import type { AgHistogramSeriesOptions } from '../series/cartesian/histogramOptions';
import type { AgLineSeriesOptions } from '../series/cartesian/lineOptions';
import type { AgScatterSeriesOptions } from '../series/cartesian/scatterOptions';
import type {
    AgHierarchySeriesOptions,
    AgHierarchySeriesTheme,
    AgBaseHierarchyThemeOptions,
} from '../series/hierarchy/hierarchyOptions';
import type { AgPieSeriesOptions } from '../series/polar/pieOptions';
import type { AgPolarSeriesTheme, AgBasePolarThemeOptions } from '../series/polar/polarOptions';

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

export interface AgBaseChartThemeOptions<T> {
    /** The palette to use. If specified, this replaces the palette from the base theme. */
    palette?: AgChartThemePalette;
    /** Configuration from this object is merged over the defaults specified in the base theme. */
    overrides?: AgBaseChartThemeOverrides<T>;
}

/** This object is used to define the configuration for a custom chart theme. */
export interface AgBaseChartTheme<T> extends AgBaseChartThemeOptions<T> {
    /**
     * The name of the theme to base your theme on. Your custom theme will inherit all of the configuration from
     * the base theme, allowing you to override just the settings you wish to change using the `overrides` config (see
     * below).
     */
    baseTheme?: AgChartThemeName;
}

export interface AgBaseChartThemeOverrides<T> {
    /** Specifies defaults for all cartesian charts (used for bar, column, histogram, line, scatter and area series) */
    cartesian?: AgBaseCartesianThemeOptions<AgCartesianSeriesTheme> & T;
    /** Specifies defaults for bar charts. */
    bar?: AgBaseCartesianThemeOptions<AgBarSeriesOptions> & T;
    /** Specifies defaults for line charts. */
    line?: AgBaseCartesianThemeOptions<AgLineSeriesOptions> & T;
    /** Specifies defaults for area charts. */
    area?: AgBaseCartesianThemeOptions<AgAreaSeriesOptions> & T;
    /** Specifies defaults for scatter/bubble charts. */
    scatter?: AgBaseCartesianThemeOptions<AgScatterSeriesOptions> & T;
    /** Specifies defaults for histogram charts. */
    histogram?: AgBaseCartesianThemeOptions<AgHistogramSeriesOptions> & T;

    /** Specifies defaults for all polar charts (used for pie series) */
    polar?: AgBasePolarThemeOptions<AgPolarSeriesTheme> & T;
    /** Specifies defaults for pie/doughnut charts. */
    pie?: AgBasePolarThemeOptions<AgPieSeriesOptions> & T;

    /** Specifies defaults for all hierarchy charts (used for treemap series) */
    hierarchy?: AgBaseHierarchyThemeOptions<AgHierarchySeriesTheme> & T;
    /** Specifies defaults for all treemap charts. */
    treemap?: AgBaseHierarchyThemeOptions<AgHierarchySeriesOptions> & T;

    /** Specifies defaults for all chart types. Be careful to only use properties that apply to all chart types here. For example, don't specify `navigator` configuration here as navigators are only available in cartesian charts. */
    common?: any;
}
