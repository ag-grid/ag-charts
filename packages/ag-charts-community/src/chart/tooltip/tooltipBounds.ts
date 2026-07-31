import type { Bounds, CanvasPoint } from 'ag-charts-core';
import type { AgTooltipAnchorTo, AgTooltipPlacement } from 'ag-charts-types';

const horizontalAlignments: Record<AgTooltipPlacement, -1 | 0 | 1> = {
    left: -1,
    'top-left': -1,
    'bottom-left': -1,
    top: 0,
    center: 0,
    bottom: 0,
    right: 1,
    'top-right': 1,
    'bottom-right': 1,
};

const verticalAlignments: Record<AgTooltipPlacement, -1 | 0 | 1> = {
    'top-left': -1,
    top: -1,
    'top-right': -1,
    left: 0,
    center: 0,
    right: 0,
    'bottom-left': 1,
    bottom: 1,
    'bottom-right': 1,
};

export interface TooltipBoundsOpts extends CanvasPoint {
    elementSize: { width: number; height: number };
    anchorTo: AgTooltipAnchorTo;
    placement: AgTooltipPlacement;
    yOffset: number;
    xOffset: number;
    offset: number;
    canvasRect: { width: number; height: number };
}

export function getTooltipBounds(opts: TooltipBoundsOpts): Bounds {
    const { elementSize, anchorTo, placement, canvasX, canvasY, yOffset, xOffset, offset, canvasRect } = opts;

    const { width: tooltipWidth, height: tooltipHeight } = elementSize;
    const bounds: Bounds = { width: tooltipWidth, height: tooltipHeight };

    if (anchorTo === 'node' || anchorTo === 'pointer') {
        const horizontalAlignment = horizontalAlignments[placement];
        const verticalAlignment = verticalAlignments[placement];
        bounds.top = canvasY + yOffset + (tooltipHeight * (verticalAlignment - 1)) / 2 + offset * verticalAlignment;
        bounds.left = canvasX + xOffset + (tooltipWidth * (horizontalAlignment - 1)) / 2 + offset * horizontalAlignment;
        return bounds;
    }

    // For chart-edge anchoring, `offset` pushes the tooltip inward from the anchored edge,
    // i.e. opposite sign to the pointer/node branch which pushes away from an anchor point.
    switch (placement) {
        case 'top': {
            bounds.top = yOffset + offset;
            bounds.left = canvasRect.width / 2 - tooltipWidth / 2 + xOffset;
            return bounds;
        }
        case 'right': {
            bounds.top = canvasRect.height / 2 - tooltipHeight / 2 + yOffset;
            bounds.left = canvasRect.width - tooltipWidth + xOffset - offset;
            return bounds;
        }
        case 'left': {
            bounds.top = canvasRect.height / 2 - tooltipHeight / 2 + yOffset;
            bounds.left = xOffset + offset;
            return bounds;
        }
        case 'bottom': {
            bounds.top = canvasRect.height - tooltipHeight + yOffset - offset;
            bounds.left = canvasRect.width / 2 - tooltipWidth / 2 + xOffset;
            return bounds;
        }
        case 'top-left': {
            bounds.top = yOffset + offset;
            bounds.left = xOffset + offset;
            return bounds;
        }
        case 'top-right': {
            bounds.top = yOffset + offset;
            bounds.left = canvasRect.width - tooltipWidth + xOffset - offset;
            return bounds;
        }
        case 'bottom-right': {
            bounds.top = canvasRect.height - tooltipHeight + yOffset - offset;
            bounds.left = canvasRect.width - tooltipWidth + xOffset - offset;
            return bounds;
        }
        case 'bottom-left': {
            bounds.top = canvasRect.height - tooltipHeight + yOffset - offset;
            bounds.left = xOffset + offset;
            return bounds;
        }
    }

    return bounds;
}
