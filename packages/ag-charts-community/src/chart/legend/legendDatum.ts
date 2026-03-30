import {
    type ColorScaleState,
    type GradientColorStop,
    type PluginModuleInstance,
    deriveNormalizedStops,
    formatColorBinLabel,
} from 'ag-charts-core';
import type { AgChartLegendListeners, AgColorScaleColorStop, TextOrSegments } from 'ag-charts-types';

import type { Scene } from '../../scene/scene';
import type { LegendSymbolOptions } from './legendSymbol';

export interface ChartLegend extends PluginModuleInstance {
    attachLegend(scene: Scene): void;
    destroy(): void;
    data: any;
    listeners?: AgChartLegendListeners;
    pagination?: {
        currentPage: number;
        setPage: (pageNumber: number) => void;
    };
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
        text: TextOrSegments; // display name for the sub-component
    };
    skipAnimations?: boolean;
    isFixed?: boolean;
    hideToggleOtherSeries?: true; // used to hide "Toggle Other Series" for Multi-Donut and Pie/Donut combo charts.
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
}

/**
 * Derives named labels for the gradient legend from fills that have a `name`.
 * For discrete mode, labels are placed at bin midpoints; for continuous mode,
 * at the resolved stop positions.
 */
function deriveNamedLabels(
    colorScale: ColorScaleState,
    fills: AgColorScaleColorStop[]
): GradientLegendNamedLabel[] | undefined {
    const { domain, range, mode } = colorScale;
    if (range.length === 0) return undefined;

    const d0 = domain[0];
    const d1 = domain.at(-1)!;
    const extent = d1 - d0 || 1;
    const labels: GradientLegendNamedLabel[] = [];

    for (let i = 0; i < range.length; i++) {
        const name = fills[i]?.name;
        if (name == null) continue;

        const dataPosition = mode === 'discrete' ? (domain[i] + domain[i + 1]) / 2 : domain[i];
        labels.push({ position: (dataPosition - d0) / extent, label: name });
    }

    return labels.length > 0 ? labels : undefined;
}

/**
 * Builds a gradient legend datum from a configured ColorScale, deriving
 * normalised colour stops from its domain/range/mode.
 */
export function buildGradientLegendDatum(
    colorScale: ColorScaleState,
    fills: AgColorScaleColorStop[],
    seriesId: string,
    enabled: boolean,
    series: FormatterBoundSeries[]
): GradientLegendDatum {
    const { domain } = colorScale;
    return {
        legendType: 'gradient',
        enabled,
        seriesId,
        series,
        colorStops: deriveNormalizedStops(colorScale),
        axisDomain: [domain[0], domain.at(-1)!] as [number, number],
        namedLabels: deriveNamedLabels(colorScale, fills),
    };
}

/**
 * Builds category legend data for a discrete colour scale, deriving bin
 * boundaries on the fly from the ColorScale's domain/range state.
 */
export function buildColorCategoryLegendData(
    colorScale: ColorScaleState,
    fills: AgColorScaleColorStop[],
    seriesId: string,
    enabled: boolean,
    formatValue: (value: number, maximumFractionDigits?: number) => string
): CategoryLegendDatum[] {
    const { domain, range } = colorScale;
    if (range.length === 0) return [];

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
                    shape: 'square',
                    fill: color,
                    fillOpacity: 1,
                    stroke: undefined,
                    strokeWidth: 0,
                    strokeOpacity: 1,
                },
            },
            label: { text: name ?? formatColorBinLabel(start, end, i, range.length, formatValue) },
            isFixed: true,
            hideToggleOtherSeries: true,
        };
    });
}
