import type { FillStrokeMorph } from 'ag-charts-core';
import type { AgSeriesSegmentation, AgSeriesShapeSegmentOptions } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedSeriesSegmentation<SegmentOptions = NormalisedSeriesShapeSegmentOptions> = Normalised<
    AgSeriesSegmentation<SegmentOptions>,
    never,
    { segments: NormalisedSeriesShapeSegmentOptions[] }
>;

export type NormalisedSeriesShapeSegmentOptions = Normalised<AgSeriesShapeSegmentOptions, never, FillStrokeMorph>;
