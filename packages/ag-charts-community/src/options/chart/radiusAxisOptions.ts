import type { AgAxisNumberTickOptions } from '../series/cartesian/cartesianOptions';
import type { AgAxisCaptionOptions, AgBaseAxisOptions } from './axisOptions';
import type { AgBaseCrossLineLabelOptions, AgBaseCrossLineOptions } from './crossLineOptions';
import type { Ratio } from './types';

export interface AgRadiusNumberAxisOptions extends AgBaseAxisOptions {
    type: 'radius-number';
    /** If 'true', the range will be rounded up to ensure nice equal spacing between the ticks. */
    nice?: boolean;
    /** User override for the automatically determined min value (based on series data). */
    min?: number;
    /** User override for the automatically determined max value (based on series data). */
    max?: number;
    /** The rotation angle of axis line and labels in degrees. */
    positionAngle?: number;
    /** Configuration for the axis ticks. */
    tick?: AgAxisNumberTickOptions;
    /** Shape of axis. Default: `polygon` */
    shape?: 'polygon' | 'circle';
    /** Configuration for the title shown next to the axis. */
    title?: AgAxisCaptionOptions;
    /** Add cross lines or regions corresponding to data values. */
    crossLines?: AgRadiusCrossLineOptions[];
    /** The ratio of the inner radius of the axis. */
    innerRadiusRatio?: Ratio;
}

export interface AgRadiusCrossLineOptions extends AgBaseCrossLineOptions<AgRadiusCrossLineLabelOptions> {}

export interface AgRadiusCrossLineLabelOptions extends AgBaseCrossLineLabelOptions {
    positionAngle?: number;
}
