import type { AgSeriesAreaBackgroundRegion, AgSeriesAreaBackgroundRegionRange } from 'ag-charts-types';

import type { AxisID } from '../idBranding';
import type { Normalised } from './normalise';
import type { FillStrokeMorph } from './normalisedCommonOptions';

export type NormalisedSeriesAreaBackgroundRegion = Normalised<
    AgSeriesAreaBackgroundRegion,
    never,
    FillStrokeMorph & {
        xRange?: NormalisedSeriesAreaBackgroundRegionRange;
        yRange?: NormalisedSeriesAreaBackgroundRegionRange;
    }
>;

export type NormalisedSeriesAreaBackgroundRegionRange = Normalised<
    AgSeriesAreaBackgroundRegionRange,
    never,
    {
        axis?: AxisID;
    }
>;
