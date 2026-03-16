import type { PluginModuleInstance } from 'ag-charts-core';
import type { AgChartLegendListeners, TextOrSegments } from 'ag-charts-types';

import { type ColorScaleState, type GradientColorStop, deriveNormalizedStops } from '../../scale/colorScaleUtil';
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

export interface GradientLegendDatum extends BaseChartLegendDatum {
    legendType: 'gradient';
    enabled: boolean;
    seriesId: string;
    series: FormatterBoundSeries[];
    colorStops: GradientColorStop[];
    axisDomain: [number, number];
}

/**
 * Builds a gradient legend datum from a configured ColorScale, deriving
 * normalised colour stops from its domain/range/mode.
 */
export function buildGradientLegendDatum(
    colorScale: ColorScaleState,
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
    };
}
