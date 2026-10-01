import type { AgChartLegendPosition, AgChartLegendPositionOptions } from 'ag-charts-types';

import { ZIndexMap } from '../types/zIndexMap';

export function expandLegendPosition(position: AgChartLegendPosition): Required<AgChartLegendPositionOptions> {
    // Legend.position use to be a string, but now it's an object. For backward compatibility, fallback to legacy
    // defaults if this.position is a string.
    const {
        placement = 'bottom',
        floating = false,
        xOffset = 0,
        yOffset = 0,
    } = typeof position === 'string' ? { placement: position, floating: false } : position;
    return { placement, floating, xOffset, yOffset };
}

/**
 * The z-index of a legend's background box. A legend that is not floating draws its box just above the chart
 * background, so overlays such as the flash-on-update tint paint over it as they do over the chart background.
 */
export function legendContainerZIndex(floating: boolean): number | readonly number[] {
    return floating ? ZIndexMap.LEGEND : [ZIndexMap.CHART_BACKGROUND, 1];
}
