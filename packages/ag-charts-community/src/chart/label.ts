import {
    BaseProperties,
    type CollideWith,
    type NormalisedTextOrSegments,
    Property,
    type RequireOptional,
    isArray,
    mergeDefaults,
} from 'ag-charts-core';
import type {
    AgChartLabelCollideWithOptions,
    AgChartLabelCollisionOptions,
    AgChartLabelCollisionPlacement,
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    AgChartLabelOrientation,
    AgChartLabelPlacementStyleOptions,
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
    ContextDefault,
    FontStyle,
    FontWeight,
    Padding,
    PaddingOptions,
    RichFormatter,
    Styler,
    TextWrap,
} from 'ag-charts-types';

import type { ContextFormatter } from '../module/axisContext';
import { FormatManager } from './formatter/formatManager';

interface FormatterCache {
    type: string;
    format: string;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

export class LabelBorder {
    @Property
    enabled: boolean = true;

    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;
}

/** Placement-reactive border stroke. `enabled` is governed by the top-level `label.border`. */
export class LabelPlacementBorder {
    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;
}

class LabelCollideWith extends BaseProperties implements AgChartLabelCollideWithOptions {
    @Property
    markers?: boolean;

    @Property
    labels?: boolean;

    @Property
    seriesItems?: boolean;

    @Property
    seriesArea?: boolean;
}

export class LabelCollision extends BaseProperties implements AgChartLabelCollisionOptions {
    @Property
    threshold?: number;

    @Property
    alwaysShow: boolean = true;

    @Property
    collideWith = new LabelCollideWith();

    /**
     * Resolved per-category obstacle toggles. Applies the global default profile: marker/label/seriesArea
     * avoidance default on, seriesItem defaults off; a per-series theme overrides these via `collideWith`.
     */
    resolveCollideWith(): CollideWith {
        const { markers, labels, seriesItems, seriesArea } = this.collideWith;
        return {
            marker: markers ?? true,
            label: labels ?? true,
            seriesItem: seriesItems ?? false,
            seriesArea: seriesArea ?? true,
        };
    }
}

export class LabelStyle extends BaseProperties implements AgChartLabelStyleOptions {
    @Property
    border = new LabelBorder();

    @Property
    color?: string;

    @Property
    cornerRadius?: number;

    @Property
    fill?: string;

    @Property
    fillOpacity?: number;

    @Property
    fontStyle?: FontStyle;

    @Property
    fontWeight?: FontWeight;

    @Property
    fontSize!: number;

    @Property
    fontFamily!: string;

    @Property
    padding?: Padding;
}

/** Style overrides applied to a label for one resolved placement (inside or outside). */
export class LabelPlacementStyle extends BaseProperties implements AgChartLabelPlacementStyleOptions {
    @Property
    color?: string;

    @Property
    fill?: string;

    @Property
    fillOpacity?: number;

    @Property
    cornerRadius?: number;

    @Property
    padding?: Padding;

    @Property
    border = new LabelPlacementBorder();
}

export class Label<TParams = never, TDatum = any>
    extends LabelStyle
    implements AgChartLabelOptions<TDatum, RequireOptional<TParams>>
{
    @Property
    enabled: boolean = false;

    @Property
    collision = new LabelCollision();

    @Property
    orientation?: AgChartLabelOrientation | AgChartLabelOrientation[];

    @Property
    maxWidth?: number;

    @Property
    maxHeight?: number;

    @Property
    wrapping?: TextWrap;

    @Property
    truncate?: boolean;

    @Property
    formatter?: RichFormatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>;

    @Property
    format?: string;

    @Property
    itemStyler?: Styler<AgChartLabelStylerParams<TDatum, ContextDefault>, AgChartLabelStyleOptions>;

    private _cachedFormatter: FormatterCache | undefined = undefined;
    formatValue(
        formatWithContext: ContextFormatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>
    ) {
        const { formatter, format } = this;

        let result: NormalisedTextOrSegments | undefined;
        if (formatter != null) {
            result ??= formatWithContext(formatter, params);
        }

        if (format != null) {
            let cachedFormatter = this._cachedFormatter;
            if (cachedFormatter?.type !== type || cachedFormatter?.format !== format) {
                cachedFormatter = {
                    type,
                    format,
                    formatter: FormatManager.getFormatter(type, format),
                };
                this._cachedFormatter = cachedFormatter;
            }

            result ??= cachedFormatter.formatter?.(value);
        }

        return result == null || isArray(result) ? result : String(result);
    }
}

/** Label for point-like series (line, area, scatter, bubble, map-marker) that resolve a directional placement. */
export class PlacedSeriesLabel<TParams = never, TDatum = any> extends Label<TParams, TDatum> {
    @Property
    placement?: AgChartLabelCollisionPlacement | AgChartLabelCollisionPlacement[];

    @Property
    spacing?: number;

    @Property
    insideStyle = new LabelPlacementStyle();

    @Property
    outsideStyle = new LabelPlacementStyle();
}

type LabelBoxingMixin = {
    border?: { enabled?: boolean; stroke?: string; strokeWidth?: number };
    fill?: unknown;
    padding?: Padding;
};

/** Whether the label draws a background box: it has a fill, or an enabled border with a stroke. */
export function labelHasBox(label: LabelBoxingMixin | undefined): boolean {
    const { enabled: borderEnabled = false, stroke: borderStroke } = label?.border ?? {};
    return label?.fill != null || (borderEnabled && borderStroke != null);
}

/** How far a drawn border stroke extends beyond the box edge on each side (half its width); `0` when no border is drawn. */
function labelBorderInset(label: LabelBoxingMixin | undefined): number {
    const { enabled: borderEnabled = false, stroke: borderStroke, strokeWidth = 0 } = label?.border ?? {};
    return borderEnabled && borderStroke != null ? strokeWidth / 2 : 0;
}

export function expandLabelPadding(label: LabelBoxingMixin | undefined): Required<PaddingOptions> {
    const padding = labelHasBox(label) ? label?.padding : null;

    if (padding == null) {
        return { bottom: 0, left: 0, right: 0, top: 0 };
    } else if (typeof padding === 'number') {
        return { bottom: padding, left: padding, right: padding, top: padding };
    } else {
        const { bottom = 0, left = 0, right = 0, top = 0 } = padding satisfies PaddingOptions;
        return { bottom, left, right, top };
    }
}

/**
 * Overlays the top-level label beneath a placement style so an explicit placement value wins and any
 * unset property falls back to the top-level label. `border` is merged field-wise because it is a
 * class instance `mergeDefaults` would otherwise copy by reference; the placement stroke geometry
 * wins while `border.enabled` (placement border has none) falls through from the top-level label.
 */
export function resolvePlacementLabelStyle<TParams>(
    label: Label<TParams>,
    placementStyle: LabelPlacementStyle | undefined
): Label<TParams> {
    if (placementStyle == null) return label;
    const resolved = mergeDefaults(placementStyle, label);
    resolved.border = mergeDefaults(placementStyle.border, label.border);
    return resolved;
}

/**
 * Per-side extent of the label's drawn box beyond its text: box padding plus the outward half of any
 * border stroke. This is the footprint collisions must reserve so labels avoid the box, not just the text.
 */
export function expandLabelBoxExtent(label: LabelBoxingMixin | undefined): Required<PaddingOptions> {
    const padding = expandLabelPadding(label);
    const inset = labelBorderInset(label);
    if (inset === 0) return padding;
    return {
        bottom: padding.bottom + inset,
        left: padding.left + inset,
        right: padding.right + inset,
        top: padding.top + inset,
    };
}

/** Reserves the larger of the two placements' box extent, as placement is not resolved until layout. */
export function expandPlacementLabelBoxExtent<TParams>(
    label: Label<TParams> & { insideStyle: LabelPlacementStyle; outsideStyle: LabelPlacementStyle }
): Required<PaddingOptions> {
    const inside = expandLabelBoxExtent(resolvePlacementLabelStyle(label, label.insideStyle));
    const outside = expandLabelBoxExtent(resolvePlacementLabelStyle(label, label.outsideStyle));
    return {
        bottom: Math.max(inside.bottom, outside.bottom),
        left: Math.max(inside.left, outside.left),
        right: Math.max(inside.right, outside.right),
        top: Math.max(inside.top, outside.top),
    };
}

/**
 * Resolved per-side box padding folded into a placement label's anchor offset. All-zero for a boxless
 * label, so its gap from the shape comes solely from `spacing`; the caller adds the side facing the
 * shape (known per datum) to keep the box edge — not the text — at `spacing`.
 */
export function resolvePlacementLabelPadding<TParams>(
    label: Label<TParams>,
    placementStyle: LabelPlacementStyle | undefined
): Required<PaddingOptions> {
    return expandLabelPadding(resolvePlacementLabelStyle(label, placementStyle));
}

/**
 * Resolved per-side extent of a placement label's drawn box (padding plus the outward half of any border
 * stroke) folded into its anchor offset, so the box's outer edge — not just the padding boundary — sits
 * `spacing` from the shape. All-zero for a boxless label.
 */
export function resolvePlacementLabelBoxExtent<TParams>(
    label: Label<TParams>,
    placementStyle: LabelPlacementStyle | undefined
): Required<PaddingOptions> {
    return expandLabelBoxExtent(resolvePlacementLabelStyle(label, placementStyle));
}

/**
 * Offset from a placed label's reserved top-left to its text anchor. The reservation spans the larger of
 * the two placements' extents, so the surplus is split evenly to keep the drawn box centred on whatever
 * the placement engine centred the reservation on.
 */
export function placedLabelTextOffset<TParams>(
    label: Label<TParams> & { insideStyle: LabelPlacementStyle; outsideStyle: LabelPlacementStyle },
    placementStyle: LabelPlacementStyle | undefined
): { x: number; y: number } {
    const reserved = expandPlacementLabelBoxExtent(label);
    const drawn = resolvePlacementLabelPadding(label, placementStyle);
    return {
        x: drawn.left + (reserved.left + reserved.right - drawn.left - drawn.right) / 2,
        y: drawn.top + (reserved.top + reserved.bottom - drawn.top - drawn.bottom) / 2,
    };
}
