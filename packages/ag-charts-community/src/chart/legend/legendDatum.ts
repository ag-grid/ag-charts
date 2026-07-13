import {
    type ColorScaleState,
    type GradientColorStop,
    type NormalisedTextOrSegments,
    type PluginModuleInstance,
    deriveNormalizedStops,
    formatColorBinLabel,
    toNumber,
} from 'ag-charts-core';
import type {
    AgChartLegendListeners,
    AgColorScaleColorStop,
    AgMarkerShape,
    NumberFormatterParams,
} from 'ag-charts-types';

import type { ColorScale } from '../../scale/colorScale';
import type { Scene } from '../../scene/scene';
import type { FormatManager, GlobalContextFormatter } from '../formatter/formatManager';
import type { LegendSymbolOptions } from './legendSymbol';

export interface ChartLegend extends PluginModuleInstance {
    attachLegend(scene: Scene): void;
    destroy(): void;
    data: any;
    listeners?: AgChartLegendListeners;
    pagination?: {
        currentPage: number;
        totalPages: number;
        setPage: (pageNumber: number) => void;
    };
    restorePage?: (page: number) => void;
}

export type ChartLegendType = 'category' | 'gradient';
export type ChartLegendDatum<T extends ChartLegendType> = T extends 'category'
    ? CategoryLegendDatum
    : T extends 'gradient'
      ? GradientLegendDatum
      : never;

export interface BaseChartLegendDatum {
    legendType: ChartLegendType;
    seriesId: string;
    enabled: boolean;
    hideInLegend?: boolean;
}

export interface CategoryLegendDatum extends BaseChartLegendDatum {
    legendType: 'category';
    id: string; // component ID
    itemId: string | number; // sub-component ID
    datum?: any; // series datum
    symbol: LegendSymbolOptions;
    /** Optional deduplication id - used to coordinate synced toggling of multiple items. */
    legendItemName?: string;
    label: {
        text: NormalisedTextOrSegments; // display name for the sub-component
    };
    skipAnimations?: boolean;
    isFixed?: boolean;
    hideToggleOtherSeries?: true; // used to hide "Toggle Other Series" for Multi-Donut and Pie/Donut combo charts.
    /**
     * When true, hovering or clicking this legend item must not drive the series highlight.
     * Used by discrete colour-scale bin items whose `itemId` is a bin index, not a datum index,
     * so feeding it through the highlight pipeline would either un-highlight everything
     * (heatmap/map series) or throw (hierarchy series whose `datumIndex` is a path array).
     */
    suppressHighlight?: true;
}

interface FormatterBoundSeries {
    /** ID of the series for values on the related axis. */
    seriesId: string;
    /** Key used by the series for values on the related axis. */
    key: string;
    /** Optional name used by the series for values on the related axis. */
    name?: string;
}

export interface GradientLegendNamedLabel {
    /** Normalised position [0, 1] along the gradient bar. */
    position: number;
    /** Display label for this position. */
    label: string;
}

export interface GradientLegendDatum extends BaseChartLegendDatum {
    legendType: 'gradient';
    enabled: boolean;
    seriesId: string;
    series: FormatterBoundSeries[];
    colorStops: GradientColorStop[];
    axisDomain: [number, number];
    namedLabels?: GradientLegendNamedLabel[];
    /** When true, render as a separate gradient bar even when other gradient datums exist. */
    showSeparately?: boolean;
}

/**
 * Derives named labels for the gradient legend from fills that have a `name`.
 * For discrete mode, labels are placed at bin midpoints; for continuous mode,
 * at the resolved stop positions. Labels whose data position falls outside
 * the visible `displayDomain` are dropped.
 */
function deriveNamedLabels(
    colorScale: ColorScaleState,
    fills: AgColorScaleColorStop[]
): GradientLegendNamedLabel[] | undefined {
    const { domain, range, mode, displayDomain } = colorScale;
    if (range.length === 0) return undefined;

    // Legend axis positions at finite precision; numeric labels are formatted from the exact value elsewhere.
    const [d0, d1] = displayDomain
        ? [toNumber(displayDomain[0]), toNumber(displayDomain[1])]
        : [domain[0], domain.at(-1)!];
    const extent = d1 - d0 || 1;
    const labels: GradientLegendNamedLabel[] = [];

    for (let i = 0; i < range.length; i++) {
        const name = fills[i]?.name;
        if (name == null) continue;

        const dataPosition = mode === 'discrete' ? (domain[i] + domain[i + 1]) / 2 : domain[i];
        const position = (dataPosition - d0) / extent;
        if (position < 0 || position > 1) continue;
        labels.push({ position, label: name });
    }

    return labels.length > 0 ? labels : undefined;
}

/**
 * Clips continuous gradient stops so all positions lie within [0, 1],
 * using pre-sampled boundary colours for the collapsed edges.
 */
function clipGradientStopsToVisibleRange(
    stops: GradientColorStop[],
    d0Color: string,
    d1Color: string
): GradientColorStop[] {
    if (stops.length === 0) return stops;

    // All stops already inside [0, 1] — no clipping needed.
    const first = stops[0];
    const last = stops.at(-1)!;
    if (first.stop >= 0 && last.stop <= 1) return stops;

    const clipped: GradientColorStop[] = [{ stop: 0, color: d0Color }];
    for (const s of stops) {
        if (s.stop > 0 && s.stop < 1) clipped.push(s);
    }
    clipped.push({ stop: 1, color: d1Color });
    return clipped;
}

/**
 * Builds a gradient legend datum from a configured ColorScale, deriving
 * normalised colour stops from its domain/range/mode. Takes the concrete
 * `ColorScale` so the visible slice of the gradient can be sampled at
 * the display-domain edges via `colorScale.convert()`.
 */
export function buildGradientLegendDatum(
    colorScale: ColorScale,
    fills: AgColorScaleColorStop[],
    seriesId: string,
    enabled: boolean,
    series: FormatterBoundSeries[]
): GradientLegendDatum {
    const { domain, displayDomain, mode } = colorScale;
    const axisDomain: [number, number] = displayDomain
        ? [toNumber(displayDomain[0]), toNumber(displayDomain[1])]
        : [domain[0], domain.at(-1)!];
    const rawStops = deriveNormalizedStops(colorScale);
    const colorStops =
        mode === 'continuous'
            ? clipGradientStopsToVisibleRange(
                  rawStops,
                  colorScale.convert(axisDomain[0]),
                  colorScale.convert(axisDomain[1])
              )
            : rawStops;
    return {
        legendType: 'gradient',
        enabled,
        seriesId,
        series,
        colorStops,
        axisDomain,
        namedLabels: deriveNamedLabels(colorScale, fills),
    };
}

/**
 * Context required to format discrete-bin colour-scale legend labels through
 * the chart-level `formatter.color` pipeline. Built once per legend update by
 * the caller (the series), then handed to `buildColorCategoryLegendData`.
 */
export interface ColorScaleLegendFormatterContext {
    formatManager: FormatManager;
    formatInContext: GlobalContextFormatter;
    /** The colour-key of the series, surfaced to user formatters as `params.key`. */
    key: string | undefined;
    /** The legendItemName of the series, surfaced to user formatters as `params.legendItemName`. */
    legendItemName: string | undefined;
    /** The series formatter-context (`series.getFormatterContext('color')`), surfaced as `params.boundSeries`. */
    boundSeries: FormatterBoundSeries[];
}

/**
 * Minimal shape any colour-scale series exposes that lets us pull together a
 * `ColorScaleLegendFormatterContext` without the caller hand-packing the same
 * five fields at every site. Defined structurally so it composes with both
 * community and enterprise `Series` subclasses without an import cycle.
 */
interface ColorScaleSeries {
    readonly properties: { colorKey?: string; legendItemName?: string };
    readonly ctx: { formatManager: FormatManager };
    callWithContext: GlobalContextFormatter;
    getFormatterContext(property: 'color'): FormatterBoundSeries[];
}

/**
 * Pulls together the formatter context for a colour-scale legend from a
 * series instance. Used by every series that supports
 * `colorScale.mode === 'discrete'`. Replaces the previous per-call-site
 * boilerplate that packed the same five fields by hand.
 */
export function colorScaleLegendFormatterContext(series: ColorScaleSeries): ColorScaleLegendFormatterContext {
    return {
        formatManager: series.ctx.formatManager,
        formatInContext: series.callWithContext.bind(series),
        // Read via bracket access so the result is `string | undefined` without an `as` cast.
        key: 'colorKey' in series.properties ? series.properties.colorKey : undefined,
        legendItemName: 'legendItemName' in series.properties ? series.properties.legendItemName : undefined,
        boundSeries: series.getFormatterContext('color'),
    };
}

/**
 * Builds a number formatter for discrete-bin colour-scale legend labels.
 *
 * Routes values through the chart-level `formatter.color` callback (or the
 * matching specifier-string formatter) before falling back to the manager's
 * default numeric formatting. The FormatterParams `source` is reported as
 * `'gradient-legend'` rather than `'legend-label'` so that the same user
 * formatter applies in both legend modes — toggling `colorScale.mode` between
 * `'continuous'` and `'discrete'` should not silently switch the user's
 * formatter on or off. Any future colour-scale legend variant should keep this
 * source for the same reason. Users who want to differentiate the discrete-bin
 * labels can branch on `params.fractionDigits` (set to `0` for the integer bin
 * path) or `params.value`.
 */
function createBinFormatter(
    colorScale: ColorScaleState,
    seriesId: string,
    { formatManager, formatInContext, key, legendItemName, boundSeries }: ColorScaleLegendFormatterContext
): (value: number, fractionDigits?: number) => string {
    const { domain } = colorScale;
    return (value, fractionDigits) => {
        const params: NumberFormatterParams<any, any> = {
            type: 'number',
            value,
            datum: undefined,
            seriesId,
            legendItemName,
            key,
            source: 'gradient-legend',
            property: 'color',
            domain,
            boundSeries,
            fractionDigits,
            visibleDomain: undefined,
        };
        return formatManager.format(formatInContext, params) ?? formatManager.defaultFormat(params);
    };
}

/**
 * Builds category legend data for a discrete colour scale, deriving bin
 * boundaries on the fly from the ColorScale's domain/range state. Bin labels
 * are formatted through the chart-level formatter pipeline supplied by
 * `formatterContext` (see `ColorScaleLegendFormatterContext`).
 */
export function buildColorCategoryLegendData(
    colorScale: ColorScaleState,
    fills: AgColorScaleColorStop[],
    seriesId: string,
    enabled: boolean,
    formatterContext: ColorScaleLegendFormatterContext,
    shape: AgMarkerShape = 'square'
): CategoryLegendDatum[] {
    const { domain, range } = colorScale;
    if (range.length === 0) return [];

    const formatBinValue = createBinFormatter(colorScale, seriesId, formatterContext);

    return range.map((color, i): CategoryLegendDatum => {
        const start = domain[i];
        const end = domain[i + 1];
        const name = fills[i]?.name;

        return {
            legendType: 'category',
            id: seriesId,
            itemId: i,
            seriesId,
            enabled,
            symbol: {
                marker: {
                    shape,
                    fill: color,
                    fillOpacity: 1,
                    stroke: undefined,
                    strokeWidth: 0,
                    strokeOpacity: 1,
                },
            },
            label: { text: name ?? formatColorBinLabel(start, end, i, range.length, formatBinValue) },
            isFixed: true,
            hideToggleOtherSeries: true,
            suppressHighlight: true,
        };
    });
}
