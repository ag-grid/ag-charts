import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle, AgSeriesMarkerStylerParams } from 'ag-charts-types';

import type { RequireOptional } from '../global';
import type { Normalised } from './normalise';
import type { FillStrokeMorph } from './normalisedCommonOptions';

export type NormalisedSeriesMarkerStyle = Normalised<AgSeriesMarkerStyle, never, FillStrokeMorph>;

export type NormalisedSeriesMarkerStylerParams<TDatum, TContext> = Normalised<
    AgSeriesMarkerStylerParams<TDatum, TContext>,
    never,
    FillStrokeMorph
>;

type MarkerRequiredKeys =
    | 'enabled'
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
        // Method syntax keeps the params bivariant, so a marker typed on richer styler params satisfies a plainer caller.
        itemStyler?(
            this: void,
            params: NormalisedSeriesMarkerStylerParams<unknown, unknown> & RequireOptional<Omit<TParams, 'context'>>
        ): AgSeriesMarkerStyle | undefined;
    }
>;
