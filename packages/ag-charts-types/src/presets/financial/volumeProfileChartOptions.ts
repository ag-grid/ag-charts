import type { AgVolumeProfileSelectionOptions, AgVolumeProfileTotalSegmentOptions } from './priceVolumeOptions';

export interface AgVolumeProfileChartPreset {
    priceKey?: string;
    /** The key used to retrieve the up volume of each level from the data.
     *
     * The series has the fixed id `'volumeProfileUp'`, for use in callbacks and the Selection API.
     */
    upKey: string;
    /** The key used to retrieve the down volume of each level from the data.
     *
     * The series has the fixed id `'volumeProfileDown'`, for use in callbacks and the Selection API.
     */
    downKey: string;
    tickSize?: number;
    /** A fixed-width column showing each level's total volume, set between the price axis and the up and down bars. */
    totalSegment?: AgVolumeProfileTotalSegmentOptions;
    /** Selection of price levels. */
    selection?: AgVolumeProfileSelectionOptions;
}
