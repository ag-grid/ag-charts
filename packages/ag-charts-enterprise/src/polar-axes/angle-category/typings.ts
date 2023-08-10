import type {
    AgBaseAxisOptions,
    AgAxisCategoryTickOptions,
    AgBaseCrossLineOptions,
    AgBaseAxisLabelOptions,
} from 'ag-charts-community';

export interface AgAngleCategoryAxisOptions extends AgBaseAxisOptions<AgAngleCategoryAxisLabelOptions> {
    type: 'angle-category';
    /** Configuration for the axis ticks. */
    tick?: AgAxisCategoryTickOptions;
    /** Shape of axis. Default: `polygon` */
    shape?: 'polygon' | 'circle';
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

export type AgAngleCategoryAxisLabelOrientation = 'fixed' | 'parallel' | 'perpendicular';

export interface AgAngleCategoryAxisLabelOptions extends AgBaseAxisLabelOptions {
    /**
     * Labels orientation on the angle category axis.
     * `fixed` - all labels remain in a fixed orientation of horizontal text.
     * `parallel` - labels are in a circle around the axis.
     * `perpendicular` - labels are in the radial direction perpendicular to the axis.
     * Default: `fixed`
     */
    orientation: AgAngleCategoryAxisLabelOrientation;
}

export interface AgAngleCrossLineOptions extends AgBaseCrossLineOptions {}
