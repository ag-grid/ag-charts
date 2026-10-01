import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle, AgSeriesMarkerStylerParams } from 'ag-charts-types';

import type { RequireOptional } from '../global';
import type { BivariantCallback, Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedDropShadowOptions } from './normalisedCommonOptions';

export type NormalisedSeriesMarkerStyle = Normalised<AgSeriesMarkerStyle, never, FillStrokeMorph>;

/**
 * Marker style as applied to a marker node: the style plus the marker's `shadow`. `shadow` lives on the marker
 * options rather than `AgSeriesMarkerStyle`, so it isn't part of `itemStyler`/`styler` results or params.
 */
export type NormalisedSeriesMarkerNodeStyle = NormalisedSeriesMarkerStyle & { shadow?: NormalisedDropShadowOptions };

export type NormalisedSeriesMarkerStylerParams<TDatum, TContext> = Normalised<
    AgSeriesMarkerStylerParams<TDatum, TContext>,
    never,
    FillStrokeMorph
>;

type MarkerRequiredKeys =
    | 'enabled'
    | 'shadow'
    | 'shape'
    | 'size'
    | 'fillOpacity'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset';

export type NormalisedSeriesMarkerOptions<TParams = never> = Normalised<
    AgSeriesMarkerOptions<unknown, unknown, unknown>,
    MarkerRequiredKeys,
    FillStrokeMorph & {
        shadow: NormalisedDropShadowOptions;
        itemStyler?: BivariantCallback<
            NormalisedSeriesMarkerStylerParams<unknown, unknown> & RequireOptional<Omit<TParams, 'context'>>,
            AgSeriesMarkerStyle | undefined
        >;
    }
>;
