import type { AgAxisCaptionOptions, AgBaseAxisLabelOptions, AgBaseAxisOptions, AgContinuousAxisOptions } from './axisOptions';
import type { AgBaseCrossLineLabelOptions, AgBaseCrossLineOptions } from './crossLineOptions';
import type { AgPolarAxisShape } from './polarAxisOptions';
import type { Degree, Ratio } from './types';
export interface AgRadiusAxisLabelOptions extends AgBaseAxisLabelOptions {
}
export interface AgRadiusNumberAxisOptions extends Omit<AgBaseAxisOptions<AgRadiusAxisLabelOptions>, 'keys' | 'interval'>, AgContinuousAxisOptions {
    type: 'radius-number';
    /** The rotation angle of axis line and labels in degrees. */
    positionAngle?: Degree;
    /** Shape of axis. Default: `polygon` */
    shape?: AgPolarAxisShape;
    /** Configuration for the title shown next to the axis. */
    title?: AgAxisCaptionOptions;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgRadiusCrossLineOptions[];
    /** The ratio of the inner radius of the axis as a proportion of the overall radius.
     *  Used to create an inner circle.
     */
    innerRadiusRatio?: Ratio;
}
export interface AgRadiusCategoryAxisOptions extends Omit<AgBaseAxisOptions<AgRadiusAxisLabelOptions>, 'keys'> {
    type: 'radius-category';
    /** The rotation angle of axis line and labels in degrees. */
    positionAngle?: Degree;
    /** Configuration for the title shown next to the axis. */
    title?: AgAxisCaptionOptions;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgRadiusCrossLineOptions[];
    /** The ratio of the inner radius of the axis as a proportion of the overall radius.
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
export interface AgRadiusCrossLineOptions extends AgBaseCrossLineOptions<AgRadiusCrossLineLabelOptions> {
}
export interface AgRadiusCrossLineLabelOptions extends AgBaseCrossLineLabelOptions {
    positionAngle?: Degree;
}
