import type { AgChartLegendListeners } from 'ag-charts-types';

import type { Scene } from '../../scene/scene';
import type { LegendSymbolOptions } from './legendSymbol';

export interface ChartLegend {
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
    itemId: any; // sub-component ID
    datum?: any; // series datum
    symbol: LegendSymbolOptions;
    /** Optional deduplication id - used to coordinate synced toggling of multiple items. */
    legendItemName?: string;
    label: {
        text: string; // display name for the sub-component
    };
    skipAnimations?: boolean;
    isFixed?: boolean;
    hideToggleOtherSeries?: true; // used to hide "Toggle Other Series" for Multi-Donut and Pie/Donut combo charts.
}

export interface GradientLegendDatum extends BaseChartLegendDatum {
    legendType: 'gradient';
    enabled: boolean;
    seriesId: string;
    colorName?: string;
    colorDomain: number[];
    colorRange: string[];
}
