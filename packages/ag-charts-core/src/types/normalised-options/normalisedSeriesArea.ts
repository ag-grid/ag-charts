import type { AgSeriesAreaBackgroundRegion, AgSeriesAreaBackgroundRegionRange } from 'ag-charts-types';

import type { AxisID } from '../idBranding';
import type { Normalised } from './normalise';

export type NormalisedSeriesAreaBackgroundRegion = Normalised<
    AgSeriesAreaBackgroundRegion,
    never,
    {
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
