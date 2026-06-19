import type {
    InternalAgColorType,
    NormalisedSeriesMarkerStyle,
    NormalisedSeriesMarkerStylerParams,
    RequireOptional,
} from 'ag-charts-core';
import {
    ChangeDetectableProperties,
    Property,
    SceneChangeDetection,
    SceneObjectChangeDetection,
    TRIPLE_EQ,
    objectsEqual,
} from 'ag-charts-core';
import type { AgMarkerShape, AgSeriesMarkerStyle, Styler } from 'ag-charts-types';

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
        NormalisedSeriesMarkerStylerParams<unknown, unknown> & RequireOptional<Omit<TParams, 'context'>>,
        AgSeriesMarkerStyle
    >;

    private _cachedStyle?: NormalisedSeriesMarkerStyle;

    override onChangeDetection(property: string): void {
        // Invalidate the snapshot on any decorated property change.
        this._cachedStyle = undefined;
        super.onChangeDetection(property);
    }

    getStyle(): NormalisedSeriesMarkerStyle {
        // Returning the shared snapshot is safe: callers spread / read but never mutate it.
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
        } satisfies RequireOptional<NormalisedSeriesMarkerStyle>;
        this._cachedStyle = style;
        return style;
    }

    getDiameter(): number {
        return this.size + this.strokeWidth;
    }
}

/** Highlight/selection styles carry an extra `opacity` field via HighlightOptions's StyleMixins. */
export type MergeMarkerStyleSource = NormalisedSeriesMarkerStyle & { opacity?: number };
type MergeMarkerStyleResult = NormalisedSeriesMarkerStyle & { size: number; opacity?: number };

/** Specialised mergeDefaults: left-most non-undefined wins, no recursion (no source holds plain objects). */
export function mergeMarkerStyles(
    selectionStyle: MergeMarkerStyleSource | undefined,
    highlightStyle: MergeMarkerStyleSource | undefined,
    defaultOverride: NormalisedSeriesMarkerStyle & { size: number },
    markerStyle: NormalisedSeriesMarkerStyle,
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

/** Two-source flat merge: applied after itemStyler resolution to overlay the user style on the base. */
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
