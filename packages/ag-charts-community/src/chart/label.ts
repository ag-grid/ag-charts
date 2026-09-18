import {
    BaseProperties,
    type CollideWith,
    type NormalisedChartLabelPlacementStyleOptions,
    type NormalisedChartLabelStyleOptions,
    type NormalisedSeriesLabelOptions,
    type NormalisedTextOrSegments,
    Property,
    type RequireOptional,
    isArray,
    mergeDefaults,
    resolveCollideWith,
} from 'ag-charts-core';
import type {
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

import type { AxisFormattableLabel, ContextFormatter } from '../module/axisContext';
import { FormatManager } from './formatter/formatManager';

export interface FormatterCache {
    type: string;
    format: string;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

/** The label keys formatting reads; plain post-theme label options satisfy it directly. */
export type LabelFormatSource<TParams, TDatum> = Pick<
    NormalisedSeriesLabelOptions<TParams, TDatum>,
    'formatter' | 'format'
>;
type LabelFormatParams<TParams, TDatum> = AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>;

/** Formats `value` via the label `formatter`, then its `format` string; `cache` keeps the compiled format string. */
export function formatLabelValue<TParams, TDatum>(
    label: LabelFormatSource<TParams, TDatum>,
    cache: { formatterCache: FormatterCache | undefined },
    formatWithContext: ContextFormatter<LabelFormatParams<TParams, TDatum>>,
    type: 'number' | 'date' | 'category',
    value: any,
    params: LabelFormatParams<TParams, TDatum>
): NormalisedTextOrSegments | undefined {
    const { formatter, format } = label;

    let result: NormalisedTextOrSegments | undefined;
    if (formatter != null) {
        result ??= formatWithContext(formatter, params);
    }

    if (format != null) {
        let cachedFormatter = cache.formatterCache;
        if (cachedFormatter?.type !== type || cachedFormatter?.format !== format) {
            cachedFormatter = { type, format, formatter: FormatManager.getFormatter(type, format) };
            cache.formatterCache = cachedFormatter;
        }

        result ??= cachedFormatter.formatter?.(value);
    }

    return result == null || isArray(result) ? result : String(result);
}

/** Formats through one plain label options object, keeping its compiled `format` string; owned by base Series. */
export class LabelValueFormatter<TParams = never, TDatum = any> implements AxisFormattableLabel<
    LabelFormatParams<TParams, TDatum>
> {
    private compiled: FormatterCache | undefined;

    /** `compiledFormats` outlives the label object, which the theme rebuilds on every options update. */
    constructor(
        private readonly label: LabelFormatSource<TParams, TDatum>,
        private readonly compiledFormats: Map<string, FormatterCache>
    ) {
        this.compiled = label.format == null ? undefined : compiledFormats.get(label.format);
    }

    get formatterCache(): FormatterCache | undefined {
        return this.compiled;
    }

    set formatterCache(cache: FormatterCache | undefined) {
        this.compiled = cache;
        if (cache != null) {
            this.compiledFormats.set(cache.format, cache);
        }
    }

    formatValue(
        formatWithContext: ContextFormatter<LabelFormatParams<TParams, TDatum>>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: LabelFormatParams<TParams, TDatum>
    ): NormalisedTextOrSegments | undefined {
        return formatLabelValue(this.label, this, formatWithContext, type, value, params);
    }
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

/** Placement-reactive border: its `enabled`, explicit or auto-enabled by a sibling, wins over the top level. */
export class LabelPlacementBorder {
    @Property
    enabled?: boolean;

    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;
}

/** Undocumented per-category toggle for the obstacles a label avoids. */
class LabelCollideWith extends BaseProperties {
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

    resolveCollideWith(): CollideWith {
        return resolveCollideWith(this);
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
    minimumFontSize?: number;

    @Property
    formatter?: RichFormatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>;

    @Property
    format?: string;

    @Property
    itemStyler?: Styler<AgChartLabelStylerParams<TDatum, ContextDefault>, AgChartLabelStyleOptions>;

    formatterCache: FormatterCache | undefined = undefined;
    formatValue(
        formatWithContext: ContextFormatter<LabelFormatParams<TParams, TDatum>>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: LabelFormatParams<TParams, TDatum>
    ) {
        return formatLabelValue(this, this, formatWithContext, type, value, params);
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

/** A label carrying both placement styles, resolved once the placement engine picks a side. */
/** Placement styles are absent on series whose labels expose none (cone funnel); the label's own style then applies. */
export type PlacementStyledLabelOptions = NormalisedChartLabelStyleOptions & {
    enabled: boolean;
    insideStyle?: NormalisedChartLabelPlacementStyleOptions;
    outsideStyle?: NormalisedChartLabelPlacementStyleOptions;
};

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
 * class instance `mergeDefaults` would otherwise copy by reference; each border field, including
 * `enabled`, wins from the placement style and falls through to the top-level label when unset.
 */
export function resolvePlacementLabelStyle<TLabel extends NormalisedChartLabelStyleOptions>(
    label: TLabel,
    placementStyle: NormalisedChartLabelPlacementStyleOptions | undefined
): TLabel {
    if (placementStyle == null) return label;
    const resolved: TLabel = mergeDefaults<NormalisedChartLabelStyleOptions>(placementStyle, label) as TLabel;
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
export function expandPlacementLabelBoxExtent(label: PlacementStyledLabelOptions): Required<PaddingOptions> {
    // OPTIMIZATION: a disabled label draws no box, so there is nothing to reserve and nothing to merge.
    if (!label.enabled) return { bottom: 0, left: 0, right: 0, top: 0 };

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
export function resolvePlacementLabelPadding(
    label: NormalisedChartLabelStyleOptions,
    placementStyle: NormalisedChartLabelPlacementStyleOptions | undefined
): Required<PaddingOptions> {
    return expandLabelPadding(resolvePlacementLabelStyle(label, placementStyle));
}

/**
 * Resolved per-side extent of a placement label's drawn box (padding plus the outward half of any border
 * stroke) folded into its anchor offset, so the box's outer edge — not just the padding boundary — sits
 * `spacing` from the shape. All-zero for a boxless label.
 */
export function resolvePlacementLabelBoxExtent(
    label: NormalisedChartLabelStyleOptions,
    placementStyle: NormalisedChartLabelPlacementStyleOptions | undefined
): Required<PaddingOptions> {
    return expandLabelBoxExtent(resolvePlacementLabelStyle(label, placementStyle));
}

/**
 * Offset from a placed label's reserved top-left to its text anchor. The reservation spans the larger of
 * the two placements' extents, so the surplus is split evenly to keep the drawn box centred on whatever
 * the placement engine centred the reservation on.
 */
export function placedLabelTextOffset(
    label: PlacementStyledLabelOptions,
    placementStyle: NormalisedChartLabelPlacementStyleOptions | undefined
): { x: number; y: number } {
    if (!label.enabled) return { x: 0, y: 0 };

    const reserved = expandPlacementLabelBoxExtent(label);
    const drawn = resolvePlacementLabelPadding(label, placementStyle);
    return {
        x: drawn.left + (reserved.left + reserved.right - drawn.left - drawn.right) / 2,
        y: drawn.top + (reserved.top + reserved.bottom - drawn.top - drawn.bottom) / 2,
    };
}

/**
 * A reservation sized from the style resolved at the winning placement is filled exactly by the drawn box,
 * so the text sits one box extent in from its top-left.
 */
export function styledLabelTextOffset(style: LabelBoxingMixin): { x: number; y: number } {
    const { left, top } = expandLabelBoxExtent(style);
    return { x: left, y: top };
}
