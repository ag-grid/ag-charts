import type { AgBaseAxisOptions, AgAxisCategoryTickOptions, AgBaseCrossLineOptions } from 'ag-charts-community';

export interface AgAngleCategoryAxisOptions extends AgBaseAxisOptions {
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
    groupPaddingOuter?: number;
}

export interface AgAngleCrossLineOptions extends AgBaseCrossLineOptions {}
