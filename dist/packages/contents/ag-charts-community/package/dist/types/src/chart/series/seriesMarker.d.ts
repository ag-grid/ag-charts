import type { AgSeriesMarkerStyle, AgSeriesMarkerStylerParams, ISeriesMarker, Styler } from 'ag-charts-types';
import { ChangeDetectableProperties } from '../../scene/util/changeDetectableProperties';
import type { RequireOptional } from '../../util/types';
import type { MarkerShape } from '../marker/util';
export declare const MARKER_SHAPE: import("../../util/validation").ValidatePredicate;
export declare class SeriesMarker<TParams = never> extends ChangeDetectableProperties implements ISeriesMarker<RequireOptional<TParams>> {
    enabled: boolean;
    /** One of the predefined marker names, or a marker constructor function (for user-defined markers). */
    shape: MarkerShape;
    size: number;
    fill?: string;
    fillOpacity: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
    itemStyler?: Styler<AgSeriesMarkerStylerParams<unknown> & RequireOptional<TParams>, AgSeriesMarkerStyle>;
    getStyle(): AgSeriesMarkerStyle;
    getDiameter(): number;
}
