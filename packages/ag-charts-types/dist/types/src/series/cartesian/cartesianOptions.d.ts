import type { AgAnnotationsOptions } from '../../chart/annotationsOptions';
import type { AgAxisCaptionOptions, AgAxisContinuousIntervalOptions, AgBaseAxisLabelOptions, AgBaseAxisOptions, AgContinuousAxisOptions, TimeInterval } from '../../chart/axisOptions';
import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgBaseCrossLineLabelOptions, AgBaseCrossLineOptions, AgCrossLineLabelPosition, AgCrossLineThemeOptions } from '../../chart/crossLineOptions';
import type { AgCrosshairOptions } from '../../chart/crosshairOptions';
import type { Degree, PixelSize, Ratio } from '../../chart/types';
import type { AgCartesianSeriesOptions } from './cartesianSeriesTypes';
/** Configuration for axes in cartesian charts. */
export interface AgBaseCartesianAxisOptions<LabelType = AgCartesianAxisLabelOptions> extends AgBaseAxisOptions<LabelType> {
    /** The position on the chart where the axis should be rendered. */
    position?: AgCartesianAxisPosition;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgCartesianCrossLineOptions[];
    /** If set to a non-zero value, the axis will have the specified thickness regardless of label size. */
    thickness?: PixelSize;
    /** Configuration for the title shown next to the axis. */
    title?: AgAxisCaptionOptions;
    /** Configuration for the axis crosshair. */
    crosshair?: AgCrosshairOptions;
}
export interface AgCartesianAxisLabelOptions extends AgBaseAxisLabelOptions {
    /** If specified and axis labels may collide, they are rotated so that they are positioned at the supplied angle. This is enabled by default for category. If the `rotation` property is specified, it takes precedence. */
    autoRotate?: boolean;
    /** If autoRotate is enabled, specifies the rotation angle to use when autoRotate is activated. Defaults to an angle of 335 degrees if unspecified. */
    autoRotateAngle?: Degree;
}
export interface AgBaseCartesianChartOptions {
    /** Axis configurations. */
    axes?: AgCartesianAxisOptions[];
    /** Series configurations. */
    series?: AgCartesianSeriesOptions[];
    /** Annotations configurations. */
    annotations?: AgAnnotationsOptions;
}
export interface AgCategoryAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'category';
    /** The size of the gap between the categories as a proportion, between 0 and 1. This value is a fraction of the “step”, which is the interval between the start of a band and the start of the next band.
     */
    paddingInner?: Ratio;
    /** The padding on the outside i.e. left and right of the first and last category. In association with `paddingInner`, this value can be between 0 and 1.
     */
    paddingOuter?: Ratio;
    /** This property is for grouped column/bar series plotted on a category axis. It is a proportion between 0 and 1 which determines the size of the gap between the bars or columns within a single group along the axis.
     */
    groupPaddingInner?: Ratio;
}
export interface AgOrdinalTimeAxisOptions extends Omit<AgCategoryAxisOptions, 'type'> {
    type: 'ordinal-time';
    /** Configuration for the axis ticks interval. */
    interval?: AgAxisContinuousIntervalOptions<TimeInterval | number>;
}
export interface AgGroupedCategoryAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'grouped-category';
}
export interface AgNumberAxisOptions extends Omit<AgBaseCartesianAxisOptions, 'interval'>, AgContinuousAxisOptions {
    type: 'number';
}
export interface AgLogAxisOptions extends Omit<AgBaseCartesianAxisOptions, 'interval'>, AgContinuousAxisOptions {
    type: 'log';
    /** The base of the logarithm used. */
    base?: number;
}
export interface AgTimeAxisOptions extends Omit<AgBaseCartesianAxisOptions, 'interval'>, AgContinuousAxisOptions<Date | number, TimeInterval | number> {
    type: 'time';
}
export type AgCartesianAxisPosition = 'top' | 'right' | 'bottom' | 'left';
export type AgCartesianAxisType = 'category' | 'grouped-category' | 'ordinal-time' | 'number' | 'log' | 'time';
export type AgCartesianAxisOptions = AgNumberAxisOptions | AgLogAxisOptions | AgCategoryAxisOptions | AgOrdinalTimeAxisOptions | AgGroupedCategoryAxisOptions | AgTimeAxisOptions;
type AgCartesianAxisThemeSpecialOptions = 'position' | 'type' | 'crossLines';
/** This is the configuration shared by all types of axis. */
export interface AgCartesianAxisThemeOptions<T> {
    /** An object with axis theme overrides for the `top` positioned axes. Same configs apply here as one level above. For example, to rotate labels by 45 degrees in 'top' positioned axes one can use `top: { label: { rotation: 45 } } }`. */
    top?: Omit<T, AgCartesianAxisThemeSpecialOptions>;
    /** An object with axis theme overrides for the `right` positioned axes. Same configs apply here as one level above. */
    right?: Omit<T, AgCartesianAxisThemeSpecialOptions>;
    /** An object with axis theme overrides for the `bottom` positioned axes. Same configs apply here as one level above. */
    bottom?: Omit<T, AgCartesianAxisThemeSpecialOptions>;
    /** An object with axis theme overrides for the `left` positioned axes. Same configs apply here as one level above. */
    left?: Omit<T, AgCartesianAxisThemeSpecialOptions>;
}
export interface AgBaseCartesianThemeOptions extends AgBaseThemeableChartOptions {
    /** Axis configurations. */
    axes?: AgCartesianAxesTheme;
}
export interface AgCartesianAxesCrossLineThemeOptions {
    crossLines?: AgCrossLineThemeOptions;
}
export interface AgCartesianAxesTheme {
    /** This extends the common axis configuration with options specific to number axes. */
    number?: AgNumberAxisThemeOptions;
    /** This extends the common axis configuration with options specific to number axes. */
    log?: AgLogAxisThemeOptions;
    /** This extends the common axis configuration with options specific to category axes. */
    category?: AgCategoryAxisThemeOptions;
    /** This extends the common axis configuration with options specific to time axes. */
    time?: AgTimeAxisThemeOptions;
    /** This extends the common axis configuration with options specific to ordinal-time axes. */
    'ordinal-time'?: AgOrdinalTimeAxisThemeOptions;
    /** This extends the common axis configuration with options specific to grouped-category axes. */
    'grouped-category'?: AgGroupedCategoryAxisThemeOptions;
}
export interface AgNumberAxisThemeOptions extends Omit<AgNumberAxisOptions, 'type' | 'crossLines'>, AgCartesianAxisThemeOptions<AgNumberAxisOptions>, AgCartesianAxesCrossLineThemeOptions {
}
export interface AgLogAxisThemeOptions extends Omit<AgLogAxisOptions, 'type' | 'crossLines'>, AgCartesianAxisThemeOptions<AgLogAxisOptions>, AgCartesianAxesCrossLineThemeOptions {
}
export interface AgCategoryAxisThemeOptions extends Omit<AgCategoryAxisOptions, 'type' | 'crossLines'>, AgCartesianAxisThemeOptions<AgCategoryAxisOptions>, AgCartesianAxesCrossLineThemeOptions {
}
export interface AgOrdinalTimeAxisThemeOptions extends Omit<AgOrdinalTimeAxisOptions, 'type' | 'crossLines'>, AgCartesianAxisThemeOptions<AgOrdinalTimeAxisOptions>, AgCartesianAxesCrossLineThemeOptions {
}
export interface AgGroupedCategoryAxisThemeOptions extends Omit<AgGroupedCategoryAxisOptions, 'type' | 'crossLines'>, AgCartesianAxisThemeOptions<AgGroupedCategoryAxisOptions>, AgCartesianAxesCrossLineThemeOptions {
}
export interface AgTimeAxisThemeOptions extends Omit<AgTimeAxisOptions, 'type' | 'crossLines'>, AgCartesianAxisThemeOptions<AgTimeAxisOptions>, AgCartesianAxesCrossLineThemeOptions {
}
export interface AgCartesianCrossLineOptions extends AgBaseCrossLineOptions<AgCartesianCrossLineLabelOptions> {
}
export interface AgCartesianCrossLineLabelOptions extends AgBaseCrossLineLabelOptions {
    /** The position of the Cross Line label. */
    position?: AgCrossLineLabelPosition;
    /** The rotation of the Cross Line label in degrees. */
    rotation?: Degree;
}
export {};
