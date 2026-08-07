import type {
    AgSeriesAreaBackgroundRegion,
    AgSeriesAreaBackgroundRegionLabel,
    AgSeriesAreaBackgroundRegionRange,
} from 'ag-charts-types';

import type { AxisID } from '../idBranding';
import type { Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedPaddingOptions } from './normalisedCommonOptions';
import type { NormalisedChartLabelStyleOptions } from './normalisedLabelOptions';

export type NormalisedSeriesAreaBackgroundRegion = Normalised<
    AgSeriesAreaBackgroundRegion,
    never,
    FillStrokeMorph & {
        xRange?: NormalisedSeriesAreaBackgroundRegionRange;
        yRange?: NormalisedSeriesAreaBackgroundRegionRange;
        label?: NormalisedSeriesAreaBackgroundRegionLabel;
    }
>;

export type NormalisedSeriesAreaBackgroundRegionRange = Normalised<
    AgSeriesAreaBackgroundRegionRange,
    never,
    {
        axis?: AxisID;
    }
>;

export type NormalisedSeriesAreaBackgroundRegionLabel = Normalised<
    AgSeriesAreaBackgroundRegionLabel,
    'fontSize' | 'fontFamily' | 'fontWeight' | 'padding' | 'color' | 'cornerRadius',
    NormalisedChartLabelStyleOptions & {
        fontFamily: string;
        padding: NormalisedPaddingOptions;
    }
>;
