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
        const style = {
            size,
            shape,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        } satisfies RequireOptional<AgSeriesMarkerStyle>;
        this._cachedStyle = style;
        return style;
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
    selectionStyle: MergeMarkerStyleSource | undefined,
    highlightStyle: MergeMarkerStyleSource | undefined,
    defaultOverride: AgSeriesMarkerStyle & { size: number },
    markerStyle: AgSeriesMarkerStyle,
    inheritedStyle: MergeMarkerStyleSource | undefined
): MergeMarkerStyleResult {
    return {
        size: selectionStyle?.size ?? highlightStyle?.size ?? defaultOverride.size,
        shape:
            selectionStyle?.shape ??
            highlightStyle?.shape ??
            defaultOverride.shape ??
            markerStyle.shape ??
            inheritedStyle?.shape,
        fill:
            selectionStyle?.fill ??
            highlightStyle?.fill ??
            defaultOverride.fill ??
            markerStyle.fill ??
            inheritedStyle?.fill,
        fillOpacity:
            selectionStyle?.fillOpacity ??
            highlightStyle?.fillOpacity ??
            defaultOverride.fillOpacity ??
            markerStyle.fillOpacity ??
            inheritedStyle?.fillOpacity,
        stroke:
            selectionStyle?.stroke ??
            highlightStyle?.stroke ??
            defaultOverride.stroke ??
            markerStyle.stroke ??
            inheritedStyle?.stroke,
        strokeWidth:
            selectionStyle?.strokeWidth ??
            highlightStyle?.strokeWidth ??
            defaultOverride.strokeWidth ??
            markerStyle.strokeWidth ??
            inheritedStyle?.strokeWidth,
        strokeOpacity:
            selectionStyle?.strokeOpacity ??
            highlightStyle?.strokeOpacity ??
            defaultOverride.strokeOpacity ??
            markerStyle.strokeOpacity ??
            inheritedStyle?.strokeOpacity,
        lineDash:
            selectionStyle?.lineDash ??
            highlightStyle?.lineDash ??
            defaultOverride.lineDash ??
            markerStyle.lineDash ??
            inheritedStyle?.lineDash,
        lineDashOffset:
            selectionStyle?.lineDashOffset ??
            highlightStyle?.lineDashOffset ??
            defaultOverride.lineDashOffset ??
            markerStyle.lineDashOffset ??
            inheritedStyle?.lineDashOffset,
        // defaultOverride and markerStyle don't carry opacity — see MergeMarkerStyleSource.
        opacity: selectionStyle?.opacity ?? highlightStyle?.opacity ?? inheritedStyle?.opacity,
    };
}

/**
 * Two-source flat merge for AgSeriesMarkerStyle. Used after the itemStyler resolution
 * step where only the user-resolved style and the base style need merging.
 */
export function mergeMarkerStylesPair(
    resolved: MergeMarkerStyleSource | undefined,
    base: MergeMarkerStyleResult
): MergeMarkerStyleResult {
    if (resolved == null) return base;
    return {
        size: resolved.size ?? base.size,
        shape: resolved.shape ?? base.shape,
        fill: resolved.fill ?? base.fill,
        fillOpacity: resolved.fillOpacity ?? base.fillOpacity,
        stroke: resolved.stroke ?? base.stroke,
        strokeWidth: resolved.strokeWidth ?? base.strokeWidth,
        strokeOpacity: resolved.strokeOpacity ?? base.strokeOpacity,
        lineDash: resolved.lineDash ?? base.lineDash,
        lineDashOffset: resolved.lineDashOffset ?? base.lineDashOffset,
        opacity: resolved.opacity ?? base.opacity,
    };
}
