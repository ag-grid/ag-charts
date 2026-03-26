import type { Ratio } from '../chart/types';

export type AgInterpolationType = AgLineLinearType | AgLineSmoothType | AgLineStepType;

export interface AgLineLinearType {
    /** The type of interpolation between data points. */
    type: 'linear';
}

export interface AgLineSmoothType {
    /** The type of interpolation between data points. */
    type: 'smooth';
    /**
     * Controls the curvature of the smooth interpolation. Values nearer to 1 are smoother.
     *
     * Default: `1`
     */
    tension?: Ratio;
}

export interface AgLineStepType {
    /** The type of interpolation between data points. */
    type: 'step';
    /**
     * The position within the segment where the step occurs.
     *
     * Default: `'end'`
     */
    position?: 'start' | 'middle' | 'end';
}
