import type {
    AgBaseRadarSeriesOptions,
    AgRadarAreaSeriesOptions,
    AgRadarLineSeriesOptions,
    AgRadarSeriesLabelFormatterParams,
    AgRadarSeriesStyle,
    AgRadarSeriesStylerParams,
    AgRadialSeriesOptionsKeys,
    ContextDefault,
    CssColor,
    DatumDefault,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedColorType } from './normalisedCommonOptions';
import type { NormalisedCollisionFreeSeriesLabelOptions } from './normalisedLabelOptions';
import type { NormalisedSeriesMarkerOptions } from './normalisedSeriesMarkerOptions';

export type NormalisedRadarSeriesMarkerOptions = NormalisedSeriesMarkerOptions<AgRadialSeriesOptionsKeys>;

export type NormalisedRadarSeriesLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgRadarSeriesLabelFormatterParams>;

/** Undocumented axis bindings every radar series may carry. */
interface RadarAxisKeys {
    angleKeyAxis?: string;
    radiusKeyAxis?: string;
}

type RadarRequiredKeys =
    | 'angleKey'
    | 'radiusKey'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'marker'
    | 'label'
    | 'connectMissingData';

interface RadarOverrides {
    stroke: CssColor;
    marker: NormalisedRadarSeriesMarkerOptions;
    label: NormalisedRadarSeriesLabelOptions;
}

/** Options shared by the radar line and area series, before the common series keys are layered on. */
export type NormalisedRadarSeriesOwnOptions<TStyle extends AgRadarSeriesStyle = AgRadarSeriesStyle> = Normalised<
    Omit<AgBaseRadarSeriesOptions<DatumDefault, ContextDefault, TStyle>, 'highlight'>,
    RadarRequiredKeys,
    RadarOverrides & {
        // Method syntax keeps the params bivariant, so a leaf typed on its own styler params satisfies the base.
        styler?(
            this: void,
            params: AgRadarSeriesStylerParams<DatumDefault, ContextDefault, TStyle>
        ): TStyle | undefined;
    }
> &
    RadarAxisKeys;

export type NormalisedRadarLineSeriesOwnOptions = Normalised<
    AgRadarLineSeriesOptions,
    RadarRequiredKeys,
    RadarOverrides
> &
    RadarAxisKeys;

export type NormalisedRadarAreaSeriesOwnOptions = Normalised<
    AgRadarAreaSeriesOptions,
    RadarRequiredKeys | 'fill' | 'fillOpacity',
    RadarOverrides & { fill: NormalisedColorType }
> &
    RadarAxisKeys;
