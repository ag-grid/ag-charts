import type { AgVolumeProfileTotalSegmentOptions } from './priceVolumeOptions';

export interface AgVolumeProfileChartPreset {
    priceKey?: string;
    upKey: string;
    downKey: string;
    tickSize?: number;
    /** A fixed-width column showing each level's total volume, set between the price axis and the up and down bars. */
    totalSegment?: AgVolumeProfileTotalSegmentOptions;
}
