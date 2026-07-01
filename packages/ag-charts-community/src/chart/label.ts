import {
    BaseProperties,
    type CollideWith,
    type LabelPlacement,
    type NormalisedTextOrSegments,
    Property,
    type RequireOptional,
    isArray,
} from 'ag-charts-core';
import type {
    AgChartLabelCollideWithCategoryOptions,
    AgChartLabelCollideWithOptions,
    AgChartLabelCollisionAvoidanceOptions,
    AgChartLabelCollisionStrategy,
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
    ContextDefault,
    FontStyle,
    FontWeight,
    Padding,
    PaddingOptions,
    RichFormatter,
    Styler,
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
    strategy?: AgChartLabelCollisionStrategy[];

    @Property
    minSpacing?: number;

    @Property
    collideWith = new LabelCollideWith();

    /** Whether labels should be resolved against obstacles; otherwise placed unconditionally. */
    get avoid(): boolean {
        return this.enabled === true;
    }

    /** Placements from the `reposition` strategy, falling back to the series' own default. */
    placements(fallback: readonly LabelPlacement[]): readonly LabelPlacement[] {
        if (!this.avoid) return fallback;
        const reposition = this.strategy?.find((s) => s.type === 'reposition');
        return reposition?.placements ?? fallback;
    }

    /** Resolved per-category obstacle config, or `undefined` when not avoiding collisions. */
    resolveCollideWith(): CollideWith | undefined {
        if (!this.avoid) return undefined;
        const { markers, labels, seriesItems } = this.collideWith;
        return {
            marker: { enabled: markers.enabled !== false, minSpacing: markers.minSpacing },
            label: { enabled: labels.enabled !== false, minSpacing: labels.minSpacing },
            seriesItem: { enabled: seriesItems.enabled !== false, minSpacing: seriesItems.minSpacing },
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

export class Label<TParams = never, TDatum = any>
    extends LabelStyle
    implements AgChartLabelOptions<TDatum, RequireOptional<TParams>>
{
    @Property
    enabled: boolean = false;

    @Property
    collisionAvoidance = new LabelCollisionAvoidance();

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

type LabelBoxingMixin = { border?: { enabled?: boolean; stroke?: string }; fill?: unknown; padding?: Padding };
export function expandLabelPadding(label: LabelBoxingMixin | undefined): Required<PaddingOptions> {
    const { enabled: borderEnabled = false, stroke: borderStroke } = label?.border ?? {};
    const hasBoxing = label?.fill != null || (borderEnabled && borderStroke != null);
    const padding = hasBoxing ? label?.padding : null;

    if (padding == null) {
        return { bottom: 0, left: 0, right: 0, top: 0 };
    } else if (typeof padding === 'number') {
        return { bottom: padding, left: padding, right: padding, top: padding };
    } else {
        const { bottom = 0, left = 0, right = 0, top = 0 } = padding satisfies PaddingOptions;
        return { bottom, left, right, top };
    }
}
