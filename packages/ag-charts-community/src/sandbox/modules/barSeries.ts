import type { ISeries } from '../chart/types';
import type { CommonSeriesOptions } from './defs/commonOptions';

export interface BarSeriesOptions extends CommonSeriesOptions {
    xKey: string;
    yKey: string;
    xValue?: string;
    yValue?: string;
    normalizedTo?: number;
    direction?: string;
    grouped?: boolean;
    stacked?: boolean;
    stackGroup?: string;
}

export class BarSeries implements ISeries {}
