import type {
    AgBaseRadialColumnSeriesOptions,
    AgNightingaleSeriesOptions,
    AgRadialBarSeriesOptions,
    AgRadialColumnSeriesOptions,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesLabelFormatterParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedColorType } from './normalisedCommonOptions';
import type { NormalisedCollisionFreeSeriesLabelOptions } from './normalisedLabelOptions';

export type NormalisedRadialSeriesLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgRadialSeriesLabelFormatterParams>;

/** Undocumented axis bindings every radial series may carry. */
interface RadialAxisKeys {
    angleKeyAxis?: string;
    radiusKeyAxis?: string;
}

type RadialRequiredKeys =
    | 'angleKey'
    | 'radiusKey'
    | 'fill'
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'cornerRadius'
    | 'label';

interface RadialOverrides {
    fill: NormalisedColorType;
    stroke: CssColor;
    label: NormalisedRadialSeriesLabelOptions;
    styler?: Styler<AgRadialSeriesStylerParams<unknown, unknown>, AgRadialSeriesStyle>;
    itemStyler?: Styler<AgRadialSeriesItemStylerParams<unknown, unknown>, AgRadialSeriesStyle>;
}

export type NormalisedRadialBarSeriesOwnOptions = Normalised<
    AgRadialBarSeriesOptions,
    RadialRequiredKeys,
    RadialOverrides
> &
    RadialAxisKeys;

/** Options shared by the radial column and nightingale series, before the common series keys are layered on. */
export type NormalisedRadialColumnSeriesBaseOwnOptions = Normalised<
    AgBaseRadialColumnSeriesOptions,
    RadialRequiredKeys,
    RadialOverrides
> &
    RadialAxisKeys;

export type NormalisedRadialColumnSeriesOwnOptions = Normalised<
    AgRadialColumnSeriesOptions,
    RadialRequiredKeys | 'columnWidthRatio' | 'maxColumnWidthRatio',
    RadialOverrides
> &
    RadialAxisKeys;

export type NormalisedNightingaleSeriesOwnOptions = Normalised<
    AgNightingaleSeriesOptions,
    RadialRequiredKeys,
    RadialOverrides
> &
    RadialAxisKeys;
