import type { AgChartLegendPosition, AgChartLegendPositionOptions } from 'ag-charts-types';

export function expandLegendPosition(position: AgChartLegendPosition): Required<AgChartLegendPositionOptions> {
    // Legend.position use to be a string, but now it's an object. For backward compatibilty, fallback to legacy
    // defaults if this.position is a string.
    const {
        placement = 'bottom',
        floating = false,
        xOffset = 0,
        yOffset = 0,
    } = typeof position === 'string' ? { placement: position, floating: false } : position;
    return { placement, floating, xOffset, yOffset };
}
