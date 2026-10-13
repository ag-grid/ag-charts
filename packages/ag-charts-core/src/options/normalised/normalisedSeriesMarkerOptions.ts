import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle, AgSeriesMarkerStylerParams } from 'ag-charts-types';

import type { RequireOptional } from '../../types/global';
import type { BivariantCallback, Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedDropShadowOptions } from './normalisedCommonOptions';

export type NormalisedSeriesMarkerStyle = Normalised<AgSeriesMarkerStyle, never, FillStrokeMorph>;

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
