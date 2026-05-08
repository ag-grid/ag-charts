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

/**
 * Source shape for marker-style merges. Highlight and selection styles are typed as
 * AgSeriesMarkerStyle at most callsites but actually carry an extra `opacity` field
 * (from HighlightOptions's StyleMixins) that propagates through to applyMarkerStyle.
 */
export type MergeMarkerStyleSource = AgSeriesMarkerStyle & { opacity?: number };
type MergeMarkerStyleResult = AgSeriesMarkerStyle & { size: number; opacity?: number };

/**
 * Specialised mergeDefaults for AgSeriesMarkerStyle's known keys plus opacity. Avoids
 * the generic merge's Object.keys/iterator/isPlainObject overhead per source — significant
 * in per-datum paths where this runs once per visible marker.
 *
 * Semantics match mergeDefaults: left-most non-undefined value wins. None of the keys hold
 * plain objects (lineDash is an array, shape can be a function), so no recursion is needed.
 */
export function mergeMarkerStyles(
    a: MergeMarkerStyleSource | undefined,
    b: MergeMarkerStyleSource | undefined,
    c: AgSeriesMarkerStyle & { size: number },
    d: AgSeriesMarkerStyle,
    e: MergeMarkerStyleSource | undefined
): MergeMarkerStyleResult {
    return {
        size: a?.size ?? b?.size ?? c.size,
        shape: a?.shape ?? b?.shape ?? c.shape ?? d.shape ?? e?.shape,
        fill: a?.fill ?? b?.fill ?? c.fill ?? d.fill ?? e?.fill,
        fillOpacity: a?.fillOpacity ?? b?.fillOpacity ?? c.fillOpacity ?? d.fillOpacity ?? e?.fillOpacity,
        stroke: a?.stroke ?? b?.stroke ?? c.stroke ?? d.stroke ?? e?.stroke,
        strokeWidth: a?.strokeWidth ?? b?.strokeWidth ?? c.strokeWidth ?? d.strokeWidth ?? e?.strokeWidth,
        strokeOpacity: a?.strokeOpacity ?? b?.strokeOpacity ?? c.strokeOpacity ?? d.strokeOpacity ?? e?.strokeOpacity,
        lineDash: a?.lineDash ?? b?.lineDash ?? c.lineDash ?? d.lineDash ?? e?.lineDash,
        lineDashOffset:
            a?.lineDashOffset ?? b?.lineDashOffset ?? c.lineDashOffset ?? d.lineDashOffset ?? e?.lineDashOffset,
        opacity: a?.opacity ?? b?.opacity ?? e?.opacity,
    };
}

/**
 * Two-source flat merge for AgSeriesMarkerStyle. Used after the itemStyler resolution
 * step where only the user-resolved style and the base style need merging.
 */
export function mergeMarkerStylesPair(
    a: MergeMarkerStyleSource | undefined,
    b: MergeMarkerStyleResult
): MergeMarkerStyleResult {
    if (a == null) return b;
    return {
        size: a.size ?? b.size,
        shape: a.shape ?? b.shape,
        fill: a.fill ?? b.fill,
        fillOpacity: a.fillOpacity ?? b.fillOpacity,
        stroke: a.stroke ?? b.stroke,
        strokeWidth: a.strokeWidth ?? b.strokeWidth,
        strokeOpacity: a.strokeOpacity ?? b.strokeOpacity,
        lineDash: a.lineDash ?? b.lineDash,
        lineDashOffset: a.lineDashOffset ?? b.lineDashOffset,
        opacity: a.opacity ?? b.opacity,
    };
}
