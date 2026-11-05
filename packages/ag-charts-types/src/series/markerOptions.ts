import type { ContextCallbackParams, DatumCallbackParams, HighlightState, Styler } from '../chart/callbackOptions';
import type { AgDropShadowOptions, AgGlowOptions, AgItemShadowStyle } from '../chart/dropShadowOptions';
import type { AgMarkerShape, ContextDefault, DatumDefault, PixelSize } from '../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from './cartesian/commonOptions';

export type AgSeriesMarkerStylerParams<TDatum = DatumDefault, TContext = ContextDefault> = DatumCallbackParams<
    TDatum,
    HighlightState
> &
    ContextCallbackParams<TContext> &
    AgSeriesMarkerStyle;

export interface AgSeriesMarkerStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** The size in pixels of the markers. */
    size?: PixelSize;
    /** The shape to use for the markers. You can also supply a custom marker by providing a `AgMarkerShapeFn` function. */
    shape?: AgMarkerShape;
}

export interface AgSeriesMarkerOptions<TDatum, TParams, TContext = ContextDefault> extends AgSeriesMarkerStyle {
    /** Whether to show markers. */
    enabled?: boolean;
    /** Configuration for the shadow used behind the markers. Not applied to custom marker shapes. */
    shadow?: AgDropShadowOptions;
    /** The glow of every marker, which the highlight options override. Off unless set. Not applied to custom marker shapes. */
    glow?: AgGlowOptions;
    /** Function used to return formatting for individual markers, based on the supplied information.*/
    itemStyler?: Styler<
        AgSeriesMarkerStylerParams<TDatum, TContext> & TParams,
        AgSeriesMarkerStyle & AgItemShadowStyle
    >;
}
