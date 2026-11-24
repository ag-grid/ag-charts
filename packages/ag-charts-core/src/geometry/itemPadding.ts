import type { PaddingOptions } from 'ag-charts-types';

import type { SectorBoundaries } from '../scene/util/sector';
import type { BoxBounds } from './boxBounds';
import { type FitRegion, insetFitRegion } from './fitRegion';

// Every in-item label takes its room from these helpers, so `itemPadding` shrinks the room the same way everywhere.

/**
 * How far an item edge holds a label off: the larger of `itemPadding` and any gap the edge already reserves,
 * such as the `spacing` an anchored label keeps from the end it is anchored against.
 */
export function itemEdgeInset(itemPadding: number, reserved = 0): number {
    return Math.max(itemPadding, reserved);
}

/** How much of an item's `size` along one axis a label inside it may use, with {@link itemEdgeInset} at each end. */
export function insetItemSpan(size: number, itemPadding: number, reservedLow = 0, reservedHigh = 0): number {
    return Math.max(0, size - itemEdgeInset(itemPadding, reservedLow) - itemEdgeInset(itemPadding, reservedHigh));
}

/**
 * The room a rect item offers a label inside it: `itemPadding` in from every edge, or more where an edge already
 * reserves a larger gap. `valueMin`/`valueMax` are the gaps reserved at the low and high ends of the value
 * axis, which runs along y when `isVertical`. The label's drawn box must then fit the room.
 */
export function insetItemRect(
    rect: BoxBounds,
    itemPadding: number,
    valueMin = 0,
    valueMax = 0,
    isVertical = false
): BoxBounds {
    const min = itemEdgeInset(itemPadding, valueMin);
    return isVertical
        ? {
              x: rect.x + itemPadding,
              y: rect.y + min,
              width: insetItemSpan(rect.width, itemPadding),
              height: insetItemSpan(rect.height, itemPadding, valueMin, valueMax),
          }
        : {
              x: rect.x + min,
              y: rect.y + itemPadding,
              width: insetItemSpan(rect.width, itemPadding, valueMin, valueMax),
              height: insetItemSpan(rect.height, itemPadding),
          };
}

/** How far a label's glyphs are held off its item's edge on each axis: `itemPadding` beyond the drawn box. */
export interface ItemLabelClearance {
    readonly x: number;
    readonly y: number;
}

/**
 * {@link ItemLabelClearance} for a label whose drawn box extends `box` past its glyphs. The label is fitted on
 * its own centre line, so each axis pays the larger of its two box sides.
 */
export function itemLabelClearance(itemPadding: number, box?: Required<PaddingOptions>): ItemLabelClearance {
    if (box == null) return { x: itemPadding, y: itemPadding };
    return {
        x: itemPadding + Math.max(box.left, box.right),
        y: itemPadding + Math.max(box.top, box.bottom),
    };
}

/** The room a shaped item offers a label's glyphs, held {@link itemLabelClearance} clear of the item's edge. */
export function insetItemRegion(region: FitRegion, clearance: ItemLabelClearance): FitRegion {
    if (clearance.x === 0 && clearance.y === 0) return region;
    return insetFitRegion(region, clearance.x, clearance.y);
}

/**
 * Moves a sector item's arcs and straight edges in by `itemPadding`, in place, so the sector a caller builds per
 * datum is the only allocation. A sector with no hole still reaches its centre, where the moved edges meet.
 */
export function insetItemSector<T extends SectorBoundaries>(sector: T, itemPadding: number): T {
    if (itemPadding === 0) return sector;
    const { innerRadius, outerRadius, radialEdgeInset = 0 } = sector;
    if (innerRadius > 0) sector.innerRadius = innerRadius + itemPadding;
    // A sector drawn with a negative radius keeps its sign, and moves in by the same distance.
    sector.outerRadius = Math.sign(outerRadius) * Math.max(0, Math.abs(outerRadius) - itemPadding);
    sector.radialEdgeInset = radialEdgeInset + itemPadding;
    return sector;
}
