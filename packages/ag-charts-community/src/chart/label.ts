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
    AgChartLabelCollideWithCategoryOptions,
    AgChartLabelCollideWithOptions,
    AgChartLabelCollisionAvoidanceOptions,
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

class LabelCollideWithCategory extends BaseProperties implements AgChartLabelCollideWithCategoryOptions {
    @Property
    enabled?: boolean;

    @Property
    minSpacing?: number;
}

class LabelCollideWith extends BaseProperties implements AgChartLabelCollideWithOptions {
    @Property
    markers = new LabelCollideWithCategory();

    @Property
    labels = new LabelCollideWithCategory();

    @Property
    seriesItems = new LabelCollideWithCategory();
}

export class LabelCollisionAvoidance extends BaseProperties implements AgChartLabelCollisionAvoidanceOptions {
    @Property
    enabled?: boolean;

    @Property
    minSpacing?: number;

    @Property
    collideWith = new LabelCollideWith();

    /** Whether labels should be resolved against obstacles; otherwise placed unconditionally. */
    get avoid(): boolean {
        return this.enabled === true;
    }

    /** Resolved per-category obstacle config, or `undefined` when not avoiding collisions. */
    resolveCollideWith(): CollideWith | undefined {
        if (!this.avoid) return undefined;
        const { markers, labels, seriesItems } = this.collideWith;
        // Marker/label avoidance defaults on; cross-series geometry (seriesItem) is opt-in.
        return {
            marker: { enabled: markers.enabled !== false, minSpacing: markers.minSpacing },
            label: { enabled: labels.enabled !== false, minSpacing: labels.minSpacing },
            seriesItem: { enabled: seriesItems.enabled === true, minSpacing: seriesItems.minSpacing },
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
    collisionAvoidance = new LabelCollisionAvoidance();

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
    insideStyle = new LabelPlacementStyle();

    @Property
    outsideStyle = new LabelPlacementStyle();
}

type LabelBoxingMixin = { border?: { enabled?: boolean; stroke?: string }; fill?: unknown; padding?: Padding };

/** Whether the label draws a background box: it has a fill, or an enabled border with a stroke. */
export function labelHasBox(label: LabelBoxingMixin | undefined): boolean {
    const { enabled: borderEnabled = false, stroke: borderStroke } = label?.border ?? {};
    return label?.fill != null || (borderEnabled && borderStroke != null);
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
 * Overlays a placement style beneath the top-level label so an explicit `label.<prop>` wins and any
 * unset property falls back to the placement value. `border` is merged field-wise because it is a
 * class instance `mergeDefaults` would otherwise copy by reference; the top-level `border.enabled`
 * governs whether the border shows, while the stroke geometry falls through to the placement.
 */
export function resolvePlacementLabelStyle<TParams>(
    label: Label<TParams>,
    placementStyle: LabelPlacementStyle | undefined
): Label<TParams> {
    if (placementStyle == null) return label;
    const resolved = mergeDefaults(label, placementStyle);
    resolved.border = mergeDefaults(label.border, placementStyle.border);
    return resolved;
}

/** Reserves the larger of the two placements' box padding, as placement is not resolved until layout. */
export function expandPlacementLabelPadding<TParams>(label: PlacedSeriesLabel<TParams, any>): Required<PaddingOptions> {
    const inside = expandLabelPadding(resolvePlacementLabelStyle(label, label.insideStyle));
    const outside = expandLabelPadding(resolvePlacementLabelStyle(label, label.outsideStyle));
    return {
        bottom: Math.max(inside.bottom, outside.bottom),
        left: Math.max(inside.left, outside.left),
        right: Math.max(inside.right, outside.right),
        top: Math.max(inside.top, outside.top),
    };
}

/**
 * Box inset folded into a placement label's anchor offset: the resolved uniform padding when the label
 * draws a box, else 0 — so a boxless label's gap comes solely from `spacing`.
 */
export function placementLabelBoxOffset<TParams>(
    label: Label<TParams>,
    placementStyle: LabelPlacementStyle | undefined
): number {
    const resolved = resolvePlacementLabelStyle(label, placementStyle);
    return labelHasBox(resolved) && typeof resolved.padding === 'number' ? resolved.padding : 0;
}
