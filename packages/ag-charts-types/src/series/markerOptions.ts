import type { ContextCallbackParams, DatumCallbackParams, Styler } from '../chart/callbackOptions';
import type { AgMarkerShape, PixelSize, TContextDefault, TDatumDefault } from '../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from './cartesian/commonOptions';

export type AgSeriesMarkerStylerParams<
    TDatum = TDatumDefault,
    TContext = TContextDefault,
> = DatumCallbackParams<TDatum> & ContextCallbackParams<TContext> & AgSeriesMarkerStyle;

export interface AgSeriesMarkerStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** The size in pixels of the markers. */
    size?: PixelSize;
    /** The shape to use for the markers. You can also supply a custom marker by providing a `AgMarkerShapeFn` function. */
    shape?: AgMarkerShape;
}

export interface AgSeriesMarkerOptions<TDatum, TParams> extends AgSeriesMarkerStyle {
    /** Whether to show markers. */
    enabled?: boolean;
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgSeriesMarkerStylerParams<TDatum> & TParams, AgSeriesMarkerStyle>;
}

export interface ISeriesMarker<TParams> extends AgSeriesMarkerOptions<unknown, TParams> {
    getStyle: () => AgSeriesMarkerStyle;
}
