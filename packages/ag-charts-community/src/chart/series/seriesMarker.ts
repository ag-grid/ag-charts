import type { InternalAgColorType, RequireOptional } from 'ag-charts-core';
import {
    ChangeDetectableProperties,
    Property,
    SceneChangeDetection,
    SceneObjectChangeDetection,
    TRIPLE_EQ,
    objectsEqual,
} from 'ag-charts-core';
import type { AgMarkerShape, AgSeriesMarkerStyle, AgSeriesMarkerStylerParams, Styler } from 'ag-charts-types';

export class SeriesMarker<TParams = never> extends ChangeDetectableProperties {
    @Property
    @SceneChangeDetection()
    enabled = true;

    /** One of the predefined marker names, or a marker shape function (for user-defined markers). */
    @Property
    @SceneObjectChangeDetection({ equals: TRIPLE_EQ })
    shape: AgMarkerShape = 'circle';

    @Property
    @SceneChangeDetection()
    size: number = 0; // Default derived from series-specific theme practically.

    @Property
    @SceneObjectChangeDetection({ equals: objectsEqual })
    fill?: InternalAgColorType;

    @Property
    @SceneChangeDetection()
    fillOpacity: number = 1;

    @Property
    @SceneChangeDetection()
    stroke?: string;

    @Property
    @SceneChangeDetection()
    strokeWidth: number = 1;

    @Property
    @SceneChangeDetection()
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    @SceneObjectChangeDetection({ equals: TRIPLE_EQ })
    itemStyler?: Styler<
        AgSeriesMarkerStylerParams<unknown, unknown> & RequireOptional<Omit<TParams, 'context'>>,
        AgSeriesMarkerStyle
    >;

    private _cachedStyle?: AgSeriesMarkerStyle;

    override onChangeDetection(property: string): void {
        // Any property change invalidates the cached snapshot. lineDash / lineDashOffset
        // aren't change-detected and so don't reach here; they're part of the cache build
        // itself, so a snapshot mismatch on those still reflects the latest values.
        this._cachedStyle = undefined;
        super.onChangeDetection(property);
    }

    getStyle(): AgSeriesMarkerStyle {
        // Cached snapshot — cleared on any decorated property change. Returning the same
        // object across calls is safe: callers feed it into mergeDefaults / spreads, which
        // read keys but don't mutate.
        if (this._cachedStyle !== undefined) {
            return this._cachedStyle;
        }
        const { size, shape, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        return (this._cachedStyle = {
            size,
            shape,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        } satisfies RequireOptional<AgSeriesMarkerStyle>);
    }

    getDiameter(): number {
        return this.size + this.strokeWidth;
    }
}
