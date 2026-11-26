import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle, AgSeriesMarkerStylerParams } from 'ag-charts-types';

import type { RequireOptional } from '../../types/global';
import type { BivariantCallback, Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedDropShadowOptions, NormalisedLineDash } from './normalisedCommonOptions';

export type NormalisedSeriesMarkerStyle = Normalised<AgSeriesMarkerStyle, never, FillStrokeMorph & NormalisedLineDash>;

/** The style of a marker hidden until it is selected; shared, so a series can tell it from a styler's result. */
export const HIDDEN_MARKER_STYLE: NormalisedSeriesMarkerStyle & { size: number } = Object.freeze({ size: 0 });

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
    } & NormalisedLineDash
>;
