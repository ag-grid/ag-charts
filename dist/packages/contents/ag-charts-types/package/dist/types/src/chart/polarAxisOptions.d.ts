import type { AgAxisBaseTickOptions, AgBaseAxisLabelOptions, AgBaseAxisOptions, AgContinuousAxisOptions } from './axisOptions';
import type { AgBaseCrossLineOptions } from './crossLineOptions';
import type { Degree, Ratio } from './types';
export type AgPolarAxisShape = 'polygon' | 'circle';
export interface AgAngleCategoryAxisOptions extends Omit<AgBaseAxisOptions<AgAngleAxisLabelOptions>, 'keys'> {
    type: 'angle-category';
    /** Configuration for the axis ticks. */
    tick?: AgAxisBaseTickOptions;
    /** Shape of axis. Default: `polygon` */
    shape?: AgPolarAxisShape;
    /** Angle in degrees to start ticks positioning from. */
    startAngle?: Degree;
    /** Angle in degrees to end ticks positioning at. It should be greater than `startAngle`. */
    endAngle?: Degree;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgAngleCrossLineOptions[];
    /**
     * This property is for grouped polar series plotted on a angle category axis.
     * It is a proportion between 0 and 1 which determines the size of the gap between the items within a single group along the angle axis.
     */
    groupPaddingInner?: Ratio;
    /**
     * This property is for grouped polar series plotted on a angle category axis.
     * It is a proportion between 0 and 1 which determines the size of the gap between the groups of items along the angle axis.
     */
    paddingInner?: Ratio;
}
export interface AgAngleNumberAxisOptions extends Omit<AgBaseAxisOptions<AgAngleAxisLabelOptions>, 'keys' | 'interval'>, AgContinuousAxisOptions {
    type: 'angle-number';
    /** Configuration for the axis ticks. */
    tick?: AgAxisBaseTickOptions;
    /** Angle in degrees to start ticks positioning from. */
    startAngle?: Degree;
    /** Angle in degrees to end ticks positioning at. It should be greater than `startAngle`. */
    endAngle?: Degree;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgAngleCrossLineOptions[];
}
export type AgAngleAxisLabelOrientation = 'fixed' | 'parallel' | 'perpendicular';
export interface AgAngleAxisLabelOptions extends AgBaseAxisLabelOptions {
    /**
     * Labels orientation on the angle category axis.
     * `fixed` - all labels remain in a fixed orientation of horizontal text.
     * `parallel` - labels are in a circle around the axis.
     * `perpendicular` - labels are in the radial direction perpendicular to the axis.
     *
     * Default: `fixed`
     */
    orientation?: AgAngleAxisLabelOrientation;
}
export interface AgAngleCrossLineOptions extends AgBaseCrossLineOptions {
}
