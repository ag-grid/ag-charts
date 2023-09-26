import type { AgAxisCategoryTickOptions, AgAxisNumberTickOptions } from '../series/cartesian/cartesianOptions';
import type { AgBaseAxisLabelOptions, AgBaseAxisOptions } from './axisOptions';
import type { AgBaseCrossLineOptions } from './crossLineOptions';

export type AgPolarAxisType = 'angle-category' | 'angle-number' | 'radius-category' | 'radius-number';
export type AgPolarAxisShape = 'polygon' | 'circle';

export interface AgAngleCategoryAxisOptions extends AgBaseAxisOptions<AgAngleAxisLabelOptions> {
    type: AgPolarAxisType;
    /** Configuration for the axis ticks. */
    tick?: AgAxisCategoryTickOptions;
    /** Shape of axis. Default: `polygon` */
    shape?: AgPolarAxisShape;
    /** Angle in degrees to start ticks positioning from. */
    startAngle?: number;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgAngleCrossLineOptions[];
    /**
     * This property is for grouped polar series plotted on a angle category axis.
     * It is a proportion between 0 and 1 which determines the size of the gap between the items within a single group along the angle axis.
     * Default: `0.2`
     */
    groupPaddingInner?: number;
    /**
     * This property is for grouped polar series plotted on a angle category axis.
     * It is a proportion between 0 and 1 which determines the size of the gap between the groups of items along the angle axis.
     * Default: `0.2`
     */
    paddingInner?: number;
}

export interface AgAngleNumberAxisOptions extends AgBaseAxisOptions<AgAngleAxisLabelOptions> {
    type: 'angle-number';
    /** Configuration for the axis ticks. */
    tick?: AgAxisNumberTickOptions;
    /** Angle in degrees to start ticks positioning from. */
    startAngle?: number;
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
     * Default: `fixed`
     */
    orientation?: AgAngleAxisLabelOrientation;
}

export interface AgAngleCrossLineOptions extends AgBaseCrossLineOptions {}
