import type { AgCartesianSeriesOptions } from '../series/cartesian/cartesianSeriesTypes';
import type { AgAnnotationsOptions } from './annotationsOptions';
import type {
    AgAxisBaseTickOptions,
    AgAxisCaptionOptions,
    AgAxisContinuousIntervalOptions,
    AgAxisLabelStylerParams,
    AgBaseAxisLabelOptions,
    AgBaseAxisLabelStyleOptions,
    AgBaseAxisOptions,
    AgContinuousAxisOptions,
    AgNumericAxisFormattableLabelOptions,
    AgTimeAxisFormattableLabelOptions,
    TimeInterval,
    TimeIntervalUnit,
} from './axisOptions';
import type { Styler } from './callbackOptions';
import type { AgBaseThemeableChartOptions } from './chartOptions';
import type {
    AgBaseCrossLineLabelOptions,
    AgBaseCrossLineOptions,
    AgCrossLineLabelPosition,
    AgCrossLineThemeOptions,
} from './crossLineOptions';
import type { AgBaseCrosshairLabel, AgCrosshairLabel, AgCrosshairOptions } from './crosshairOptions';
import type { Degree, PixelSize, Ratio, TContextDefault, TDatumDefault } from './types';

/** Configuration for axes in cartesian charts. */
export interface AgBaseCartesianAxisOptions<
    LabelType = AgCartesianAxisLabelOptions,
    CrosshairLabelType = AgCrosshairLabel,
    TContext = TContextDefault,
> extends AgBaseAxisOptions<LabelType, TContext> {
    /** An array of keys determining which series are charted on this axis. */
    keys?: string[];
    /** The position on the chart where the axis should be rendered. */
    position?: AgCartesianAxisPosition;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgCartesianCrossLineOptions[];
    /** If set to a non-zero value, the axis will have the specified thickness regardless of label size. */
    thickness?: PixelSize;
    /** Configuration for the title shown next to the axis. */
    title?: AgAxisCaptionOptions;
    /** Configuration for the axis crosshair. */
    crosshair?: AgCrosshairOptions<CrosshairLabelType>;
}

export interface AgTimeAxisParentLevel {
    /** Enables parent level labels and ticks. */
    enabled?: boolean;
    /** Configuration for the axis labels, shown next to the ticks. */
    label?: AgCartesianTimeAxisLabelOptions;
    /** Configuration for the axis ticks. */
    tick?: AgAxisBaseTickOptions;
}

export interface AgCartesianAxisLabelOptions
    extends AgBaseCartesianAxisLabelOptions,
        AgNumericAxisFormattableLabelOptions {}

export interface AgCartesianTimeAxisLabelOptions
    extends AgBaseCartesianAxisLabelOptions,
        AgTimeAxisFormattableLabelOptions {}

export interface AgBaseCartesianAxisLabelOptions extends AgBaseAxisLabelOptions {
    /** If specified and axis labels may collide, they are rotated so that they are positioned at the supplied angle. This is enabled by default for category. If the `rotation` property is specified, it takes precedence. */
    autoRotate?: boolean;
    /** If autoRotate is enabled, specifies the rotation angle to use when autoRotate is activated. Defaults to an angle of 335 degrees if unspecified. */
    autoRotateAngle?: Degree;
}

export interface AgGroupedCategoryAxisLabelOptions extends Omit<AgBaseAxisLabelOptions, 'itemStyler'> {
    /** Function used to style axis labels. */
    itemStyler?: Styler<AgGroupedCategoryAxisLabelStylerParams, AgBaseAxisLabelStyleOptions>;
}

export interface AgGroupedCategoryAxisLabelStylerParams extends AgAxisLabelStylerParams {
    /** The depth of the label, used by `grouped-category` axes. */
    readonly depth: number;
}

export interface AgBaseCartesianChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Axis configurations. */
    axes?: AgCartesianAxisOptions<TContext>[];
    /** Series configurations. */
    series?: AgCartesianSeriesOptions<TDatum, TContext>[];
    /** Annotations configurations. */
    annotations?: AgAnnotationsOptions;
}

export type AgGroupedCategoryDepthLabelOptions = Pick<
    AgBaseAxisLabelOptions,
    | 'enabled'
    | 'avoidCollisions'
    | 'rotation'
    | 'spacing'
    | 'color'
    | 'fontFamily'
    | 'fontSize'
    | 'fontStyle'
    | 'fontWeight'
>;

export type AgGroupedCategoryDepthTickOptions = Pick<AgAxisBaseTickOptions, 'enabled' | 'stroke' | 'width'>;

export interface AgGroupedCategoryDepthOptions {
    label?: AgGroupedCategoryDepthLabelOptions;
    tick?: AgGroupedCategoryDepthTickOptions;
}

export interface AgCategoryAxisOptions<TContext = TContextDefault>
    extends AgBaseCartesianAxisOptions<AgBaseCartesianAxisLabelOptions, AgBaseCrosshairLabel, TContext> {
    type: 'category';
    /** The size of the gap between the categories as a proportion, between 0 and 1. This value is a fraction of the “step”, which is the interval between the start of a band and the start of the next band. */
    paddingInner?: Ratio;
    /** The padding on the outside i.e. left and right of the first and last category. In association with `paddingInner`, this value can be between 0 and 1. */
    paddingOuter?: Ratio;
    /** This property is for grouped column/bar series plotted on a category axis. It is a proportion between 0 and 1 which determines the size of the gap between the bars or columns within a single group along the axis. */
    groupPaddingInner?: Ratio;
}

type AgGroupedCategoryAxisTickOptions = Omit<AgAxisBaseTickOptions, 'size'>;

export interface AgGroupedCategoryAxisOptions<TContext = TContextDefault>
    extends Omit<
        AgBaseCartesianAxisOptions<AgGroupedCategoryAxisLabelOptions, AgBaseCrosshairLabel, TContext>,
        'crossLines' | 'tick'
    > {
    type: 'grouped-category';
    /** The size of the gap between the categories as a proportion, between 0 and 1. This value is a fraction of the “step”, which is the interval between the start of a band and the start of the next band. */
    paddingInner?: Ratio;
    /** This property is for grouped column/bar series plotted on a category axis. It is a proportion between 0 and 1 which determines the size of the gap between the bars or columns within a single group along the axis. */
    groupPaddingInner?: Ratio;
    /** An array of depth options, starting from the leafs. */
    depthOptions?: AgGroupedCategoryDepthOptions[];
    /** Configuration for the axis ticks. */
    tick?: AgGroupedCategoryAxisTickOptions;
}

export interface AgTimeAxisOptions<TContext = TContextDefault>
    extends Omit<AgBaseCartesianAxisOptions<AgCartesianTimeAxisLabelOptions, AgCrosshairLabel, TContext>, 'interval'>,
        // eslint-disable-next-line sonarjs/use-type-alias
        Omit<AgContinuousAxisOptions<Date | number, TimeInterval | TimeIntervalUnit | number>, 'nice'> {
    type: 'time';
    /** Options for labels and ticks for the parent level intervals. */
    parentLevel?: AgTimeAxisParentLevel;
    /** The size of each band. */
    unit?: TimeInterval | TimeIntervalUnit;
    /** The size of the gap between the categories as a proportion, between 0 and 1. This value is a fraction of the “step”, which is the interval between the start of a band and the start of the next band. */
    paddingInner?: Ratio;
    /** The padding on the outside i.e. left and right of the first and last category. In association with `paddingInner`, this value can be between 0 and 1. */
    paddingOuter?: Ratio;
    /** This property is for grouped column/bar series plotted on a category axis. It is a proportion between 0 and 1 which determines the size of the gap between the bars or columns within a single group along the axis. */
    groupPaddingInner?: Ratio;
}

export interface AgOrdinalTimeAxisOptions<TContext = TContextDefault>
    extends AgBaseCartesianAxisOptions<AgCartesianTimeAxisLabelOptions, AgCrosshairLabel, TContext> {
    type: 'ordinal-time';
    /** Options for labels and ticks for the parent level intervals. */
    parentLevel?: AgTimeAxisParentLevel;
    /** Configuration for the axis ticks interval. */
    interval?: AgAxisContinuousIntervalOptions<TimeInterval | TimeIntervalUnit | number>;
    /** The size of the gap between the categories as a proportion, between 0 and 1. This value is a fraction of the “step”, which is the interval between the start of a band and the start of the next band. */
    paddingInner?: Ratio;
    /** The padding on the outside i.e. left and right of the first and last category. In association with `paddingInner`, this value can be between 0 and 1. */
    paddingOuter?: Ratio;
    /** This property is for grouped column/bar series plotted on a category axis. It is a proportion between 0 and 1 which determines the size of the gap between the bars or columns within a single group along the axis. */
    groupPaddingInner?: Ratio;
}

export interface AgNumberAxisOptions<TContext = TContextDefault>
    extends Omit<AgBaseCartesianAxisOptions<AgCartesianAxisLabelOptions, AgCrosshairLabel, TContext>, 'interval'>,
        AgContinuousAxisOptions {
    type: 'number';
}

export interface AgLogAxisOptions<TContext = TContextDefault>
    extends Omit<AgBaseCartesianAxisOptions<AgCartesianAxisLabelOptions, AgCrosshairLabel, TContext>, 'interval'>,
        AgContinuousAxisOptions {
    type: 'log';
    /** The base of the logarithm used. */
    base?: number;
}

export interface AgContinuousTimeAxisOptions<TContext = TContextDefault>
    extends Omit<AgBaseCartesianAxisOptions<AgCartesianTimeAxisLabelOptions, AgCrosshairLabel, TContext>, 'interval'>,
        AgContinuousAxisOptions<Date | number, TimeInterval | TimeIntervalUnit | number> {
    type: 'continuous-time';
    /** Options for labels and ticks for the parent level intervals. */
    parentLevel?: AgTimeAxisParentLevel;
}

export type AgCartesianAxisPosition = 'top' | 'right' | 'bottom' | 'left';

export type AgCartesianAxisOptions<TContext = TContextDefault> =
    | AgNumberAxisOptions<TContext>
    | AgLogAxisOptions<TContext>
    | AgCategoryAxisOptions<TContext>
    | AgOrdinalTimeAxisOptions<TContext>
    | AgContinuousTimeAxisOptions<TContext>
    | AgTimeAxisOptions<TContext>
    | AgGroupedCategoryAxisOptions<TContext>;

export type AgCartesianAxisType<TContext = TContextDefault> = AgCartesianAxisOptions<TContext>['type'];

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

export interface AgBaseCartesianThemeOptions<TDatum = TDatumDefault> extends AgBaseThemeableChartOptions<TDatum> {
    /** Axis configurations. */
    axes?: AgCartesianAxesTheme;
}

export interface AgCartesianAxesCrossLineThemeOptions<LabelType = AgBaseCrossLineLabelOptions> {
    crossLines?: AgCrossLineThemeOptions<LabelType>;
}

export interface AgCartesianAxesTheme {
    /** This extends the common axis configuration with options specific to number axes. */
    number?: AgNumberAxisThemeOptions<AgBaseCrossLineLabelOptions>;
    /** This extends the common axis configuration with options specific to number axes. */
    log?: AgLogAxisThemeOptions<AgBaseCrossLineLabelOptions>;
    /** This extends the common axis configuration with options specific to category axes. */
    category?: AgCategoryAxisThemeOptions<AgBaseCrossLineLabelOptions>;
    /** This extends the common axis configuration with options specific to time axes. */
    'continuous-time'?: AgContinuousTimeAxisThemeOptions<AgBaseCrossLineLabelOptions>;
    /** This extends the common axis configuration with options specific to ordinal-time axes. */
    'ordinal-time'?: AgOrdinalTimeAxisThemeOptions<AgBaseCrossLineLabelOptions>;
    /** This extends the common axis configuration with options specific to grouped-category axes. */
    'grouped-category'?: AgGroupedCategoryAxisThemeOptions<AgBaseCrossLineLabelOptions>;
    /** This extends the common axis configuration with options specific to unit-time axes. */
    time?: AgTimeAxisThemeOptions<AgBaseCrossLineLabelOptions>;
}

export type AgContinuousCartesianAxesTheme = Pick<AgCartesianAxesTheme, 'number' | 'log' | 'continuous-time'>;

type ThemeOmittedAxisOptions = 'context' | 'type' | 'crossLines';

export interface AgNumberAxisThemeOptions<LabelType = AgBaseCrossLineLabelOptions>
    extends Omit<AgNumberAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgCartesianAxisThemeOptions<AgNumberAxisOptions<never>>,
        AgCartesianAxesCrossLineThemeOptions<LabelType> {}

export interface AgLogAxisThemeOptions<LabelType = AgBaseCrossLineLabelOptions>
    extends Omit<AgLogAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgCartesianAxisThemeOptions<AgLogAxisOptions<never>>,
        AgCartesianAxesCrossLineThemeOptions<LabelType> {}

export interface AgCategoryAxisThemeOptions<LabelType = AgBaseCrossLineLabelOptions>
    extends Omit<AgCategoryAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgCartesianAxisThemeOptions<AgCategoryAxisOptions<never>>,
        AgCartesianAxesCrossLineThemeOptions<LabelType> {}

export interface AgOrdinalTimeAxisThemeOptions<LabelType = AgBaseCrossLineLabelOptions>
    extends Omit<AgOrdinalTimeAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgCartesianAxisThemeOptions<AgOrdinalTimeAxisOptions<never>>,
        AgCartesianAxesCrossLineThemeOptions<LabelType> {}

export interface AgGroupedCategoryAxisThemeOptions<LabelType = AgBaseCrossLineLabelOptions>
    extends Omit<AgGroupedCategoryAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgCartesianAxisThemeOptions<AgGroupedCategoryAxisOptions<never>>,
        AgCartesianAxesCrossLineThemeOptions<LabelType> {}

export interface AgContinuousTimeAxisThemeOptions<LabelType = AgBaseCrossLineLabelOptions>
    extends Omit<AgContinuousTimeAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgCartesianAxisThemeOptions<AgContinuousTimeAxisOptions<never>>,
        AgCartesianAxesCrossLineThemeOptions<LabelType> {}

export interface AgTimeAxisThemeOptions<LabelType = AgBaseCrossLineLabelOptions>
    extends Omit<AgTimeAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgCartesianAxisThemeOptions<AgTimeAxisOptions<never>>,
        AgCartesianAxesCrossLineThemeOptions<LabelType> {}

export interface AgCartesianCrossLineOptions extends AgBaseCrossLineOptions<AgCartesianCrossLineLabelOptions> {}

export interface AgCartesianCrossLineLabelOptions extends AgBaseCrossLineLabelOptions {
    /** The position of the Cross Line label. */
    position?: AgCrossLineLabelPosition;
    /** The rotation of the Cross Line label in degrees. */
    rotation?: Degree;
}
