import type { AgChartLegendListeners } from '../options/agChartOptions';
import type { BBox } from '../scene/bbox';
import type { Node } from '../scene/node';
import type { Marker } from './marker/marker';

export interface ChartLegend {
    computeBBox(): BBox;
    attachLegend(node: Node | null): void;
    destroy(): void;
    data: any;
    listeners: AgChartLegendListeners;
}

export type ChartLegendType = 'category' | 'gradient';

export interface ChartLegendDatum {
    legendType: ChartLegendType;
    seriesId: string;
    enabled: boolean;
}

export interface CategoryLegendDatum extends ChartLegendDatum {
    legendType: 'category';
    id: string; // component ID
    itemId: any; // sub-component ID
    marker: {
        shape?: string | (new () => Marker);
        fill: string;
        stroke: string;
        fillOpacity: number;
        strokeOpacity: number;
        strokeWidth: number;
    };
    /** Optional deduplication id - used to coordinate synced toggling of multiple items. */
    legendItemName?: string;
    label: {
        text: string; // display name for the sub-component
    };
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
