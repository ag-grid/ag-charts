import type { AgVolumeProfileSelectionOptions, AgVolumeProfileTotalSegmentOptions } from './priceVolumeOptions';

export interface AgVolumeProfileChartPreset {
    priceKey?: string;
    upKey: string;
    downKey: string;
    tickSize?: number;
    /** A fixed-width column showing each level's total volume, set between the price axis and the up and down bars. */
    totalSegment?: AgVolumeProfileTotalSegmentOptions;
    /** Selection of price levels.
     *
     * The segments have fixed series ids, for use in selection callbacks, `setSelection()` and `getSelection()`:
     * `'volumeProfileUp'` for the up volume and `'volumeProfileDown'` for the down volume.
     */
    selection?: AgVolumeProfileSelectionOptions;
}
