import type { AgBaseCartesianChartOptions } from '../series/cartesian/cartesianOptions';
import type { AgBaseHierarchyChartOptions } from '../series/hierarchy/hierarchyOptions';
import type { AgBasePolarChartOptions } from '../series/polar/polarOptions';
import type { AgBaseChartOptions } from './chartOptions';
import type { AgBaseChartThemeOptions, AgChartTheme, AgChartThemeName } from './themeOptions';

export interface AgChartThemeOptions extends AgBaseChartThemeOptions {}
export type AgChartThemeOverrides = NonNullable<AgChartThemeOptions['overrides']>;

export interface AgCartesianChartOptions extends AgBaseCartesianChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export interface AgPolarChartOptions extends AgBasePolarChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}
export interface AgHierarchyChartOptions extends AgBaseHierarchyChartOptions, AgBaseChartOptions<any> {
    theme?: AgChartTheme | AgChartThemeName;
}
export type AgChartOptions = AgCartesianChartOptions | AgPolarChartOptions | AgHierarchyChartOptions;

export interface AgChartInstance {
    /** Get the `AgChartOptions` representing the current chart configuration. */
    getOptions(): AgChartOptions;
    /** Destroy the chart instance and any allocated resources to support its rendering. */
    destroy(): void;
}
