import type { PlacedLabel, PointLabelDatum } from 'ag-charts-core';
import type { AgCartesianChartOptions } from 'ag-charts-types';

/**
 * Two scatter series: a small marker declared first, so painted under, at the centre of a larger one whose
 * inside label it overlaps. `over` and `under` are spread over each series' options.
 */
export function markerUnderOptions(over: object = {}, under: object = {}): AgCartesianChartOptions {
    return {
        data: [
            { x: 0, y: 0 },
            { x: 5, y: 5, u: 5 },
            { x: 10, y: 10 },
        ],
        legend: { enabled: false },
        axes: { x: { position: 'bottom', type: 'number' }, y: { position: 'left', type: 'number' } },
        series: [
            {
                type: 'scatter',
                xKey: 'x',
                yKey: 'u',
                labelKey: 'x',
                size: 10,
                label: { enabled: true, placement: 'bottom', collision: { alwaysShow: false } },
                ...under,
            },
            {
                type: 'scatter',
                xKey: 'x',
                yKey: 'y',
                labelKey: 'x',
                size: 30,
                label: { enabled: true, placement: 'inside', collision: { alwaysShow: false } },
                ...over,
            },
        ],
    };
}

/** Whether the larger series placed the inside label of the datum the smaller marker sits under. */
export function markerUnderLabelPlaced(placed: PlacedLabel<PointLabelDatum>[]): boolean {
    return placed.some((label) => label.datum.label.text === '5');
}

/** Copies a cover rectangle to a plain object for `toEqual`, keeping a missing one missing. */
export function plainRect<T extends object>(rect: T | undefined): T | undefined {
    return rect == null ? undefined : { ...rect };
}
