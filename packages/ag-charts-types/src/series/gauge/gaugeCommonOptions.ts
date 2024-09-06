import type { CssColor } from '../../chart/types';

export interface AgGaugeSegmentationInterval {
    step?: number;
    values?: number[];
    count?: number;
}

export interface AgGaugeSegmentation {
    /** Configuration for the segmentation. */
    interval?: AgGaugeSegmentationInterval;
    /** The spacing between segments. */
    spacing?: number;
}

export type AgGaugeSeriesFillMode = 'continuous' | 'discrete';

export interface AgGaugeSeriesColorStop {
    color?: CssColor;
    stop?: number;
}
