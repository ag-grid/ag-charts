import type { AgChartLegendPlacement, AgChartLegendPosition, AgChartLegendPositionOptions } from 'ag-charts-types';

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

/** Offset of a `width` x `height` box within an `areaWidth` x `areaHeight` area at `placement`. */
export function placementOffset(
    placement: AgChartLegendPlacement,
    areaWidth: number,
    areaHeight: number,
    width: number,
    height: number
): { x: number; y: number } {
    switch (placement) {
        case 'top':
            return { x: (areaWidth - width) / 2, y: 0 };
        case 'bottom':
            return { x: (areaWidth - width) / 2, y: areaHeight - height };
        case 'right':
            return { x: areaWidth - width, y: (areaHeight - height) / 2 };
        case 'left':
            return { x: 0, y: (areaHeight - height) / 2 };
        case 'top-right':
        case 'right-top':
            return { x: areaWidth - width, y: 0 };
        case 'top-left':
        case 'left-top':
            return { x: 0, y: 0 };
        case 'bottom-right':
        case 'right-bottom':
            return { x: areaWidth - width, y: areaHeight - height };
        case 'bottom-left':
        case 'left-bottom':
            return { x: 0, y: areaHeight - height };
    }
}

/** The side of the layout box a non-floating box at `placement` takes its space from. */
export function placementSide(placement: AgChartLegendPlacement): 'top' | 'bottom' | 'left' | 'right' {
    switch (placement) {
        case 'top':
        case 'top-right':
        case 'top-left':
            return 'top';
        case 'bottom':
        case 'bottom-right':
        case 'bottom-left':
            return 'bottom';
        case 'left':
        case 'left-top':
        case 'left-bottom':
            return 'left';
        case 'right':
        case 'right-top':
        case 'right-bottom':
            return 'right';
    }
}
