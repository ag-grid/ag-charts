import type { DatumCallbackParams, Styler } from '../chart/callbackOptions';
import type { MarkerShape, PixelSize } from '../chart/types';
import type { FillOptions, StrokeOptions } from './cartesian/commonOptions';
export type AgSeriesMarkerStylerParams<TDatum> = DatumCallbackParams<TDatum> & AgSeriesMarkerStyle;
export interface AgSeriesMarkerStyle extends FillOptions, StrokeOptions {
    /** The size in pixels of the markers. */
    size?: PixelSize;
    /** The shape to use for the markers. You can also supply a custom marker by providing a `Marker` subclass. */
    shape?: MarkerShape;
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
