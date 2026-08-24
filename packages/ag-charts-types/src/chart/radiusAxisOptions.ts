import type {
    AgAxisCaptionOptions,
    AgBaseAxisLabelOptions,
    AgBaseAxisOptions,
    AgContinuousAxisOptions,
    AgNumericAxisFormattableLabelOptions,
} from './axisOptions';
import type { AgBaseCrossLineLabelOptions, AgBaseCrossLineOptions, AgCrossLineThemeOptions } from './crossLineOptions';
import type { AgNumericValue } from './dataValues';
import type { AgPolarAxisShape } from './polarAxisOptions';
import type { AxisValue, ContextDefault, Degree, Ratio } from './types';

interface AgRadiusAxisFormattableLabelOptions<
    TContext = ContextDefault,
> extends AgNumericAxisFormattableLabelOptions<TContext> {}

interface AgRadiusAxisLabelOptions<TContext = ContextDefault> extends AgBaseAxisLabelOptions<TContext> {}

export interface AgRadiusNumberAxisOptions<TContext = ContextDefault>
    extends
        Omit<AgBaseAxisOptions<AgRadiusAxisFormattableLabelOptions<TContext>, TContext>, 'interval'>,
        AgContinuousAxisOptions<AgNumericValue, AgNumericValue> {
    type?: 'radius-number';
    /** The rotation angle of axis line and labels in degrees. */
    positionAngle?: Degree;
    /** Shape of axis. Default: `polygon` */
    shape?: AgPolarAxisShape;
    /** Configuration for the title shown next to the axis. */
    title?: AgAxisCaptionOptions;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgRadiusCrossLineOptions<AgNumericValue>[];
    /**
     * The ratio of the inner radius of the axis as a proportion of the overall radius.
     *  Used to create an inner circle.
     */
    innerRadiusRatio?: Ratio;
}

export interface AgRadiusCategoryAxisOptions<TContext = ContextDefault> extends AgBaseAxisOptions<
    AgRadiusAxisLabelOptions<TContext>,
    TContext
> {
    type?: 'radius-category';
    /** The rotation angle of axis line and labels in degrees. */
    positionAngle?: Degree;
    /** Configuration for the title shown next to the axis. */
    title?: AgAxisCaptionOptions;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgRadiusCrossLineOptions<AxisValue>[];
    /**
     * The ratio of the inner radius of the axis as a proportion of the overall radius.
     *  Used to create an inner circle.
     */
    innerRadiusRatio?: Ratio;
    /**
     * This property is for grouped polar series plotted on a radius category axis.
     * It is a proportion between 0 and 1 which determines the size of the gap between the items within a single group along the angle axis.
     */
    groupPaddingInner?: Ratio;
    /**
     * This property is for grouped polar series plotted on a radius category axis.
     * It is a proportion between 0 and 1 which determines the size of the gap between the groups of items along the angle axis.
     */
    paddingInner?: Ratio;
    /**
     * This property is for grouped polar series plotted on a radius category axis.
     * It is a proportion between 0 and 1 which determines the size of the gap between the groups of items along the angle axis.
     */
    paddingOuter?: Ratio;
}

export type AgRadiusCrossLineOptions<TValue = AxisValue> = AgBaseCrossLineOptions<
    TValue,
    AgRadiusCrossLineLabelOptions,
    ContextDefault
>;
export interface AgRadiusCrossLineThemeOptions extends AgCrossLineThemeOptions<AgRadiusCrossLineLabelOptions> {}

export interface AgRadiusAxesCrossLineThemeOptions {
    crossLines?: AgRadiusCrossLineThemeOptions;
}

export interface AgRadiusCrossLineLabelOptions extends AgBaseCrossLineLabelOptions {
    positionAngle?: Degree;
}
