import type { PaddingOptions } from 'ag-charts-types';

import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { type SectorBoundaries, isFullSweep } from '../scene/util/sector';
import type { LabelFit } from '../text/textWrapper';
import type { BoxBounds } from './boxBounds';
import { type FitRegion, insetFitRegion } from './fitRegion';

// Every in-item label takes its room from these helpers, so `itemPadding` shrinks the room the same way everywhere.
// Their `itemPadding` parameters take the inset {@link itemContentInset} merges from the option and the stroke.

/** The width of the stroke an item draws: `0` with no stroke colour. */
export function drawnStrokeWidth(stroke: unknown, strokeWidth: number | undefined): number {
    if (stroke == null || stroke === '' || strokeWidth == null || Number.isNaN(strokeWidth) || strokeWidth <= 0) {
        return 0;
    }
    return strokeWidth;
}

/**
 * How far an item's drawn stroke reaches in from its geometric edge: all of it for a stroke drawn inside the
 * edge (rects, tiles and sectors), half of it for one centred on the edge (markers and map shapes).
 */
export function itemStrokeDepth(stroke: unknown, strokeWidth: number | undefined, centred: boolean): number {
    const width = drawnStrokeWidth(stroke, strokeWidth);
    return centred ? width / 2 : width;
}

/**
 * How far an in-item label is held in from its item's geometric edge. A positive `padding` is measured from the
 * edge and never puts the label over the stroke; a negative one moves the label that far into the stroke, but
 * never past the edge.
 */
export function itemContentInset(padding: number, strokeDepth: number): number {
    return padding >= 0 ? Math.max(strokeDepth, padding) : Math.max(0, strokeDepth + padding);
}

/**
 * The room an in-item label was fitted into against its item's resting stroke, kept so it can be fitted again
 * when a state draws the item with another stroke.
 */
export interface ItemLabelRoom {
    /** The room the label's glyphs were fitted into. */
    width: number;
    height: number;
    /** The configured padding, and the inset it resolved to against the resting stroke. */
    padding: number;
    inset: number;
    /** Whether the item's stroke is centred on its outline rather than drawn inside it. */
    centred: boolean;
    /** The gap an anchored end reserves, and that end's inward direction on each axis; `0` on a centred axis. */
    spacing: number;
    anchorX: number;
    anchorY: number;
}

/** An in-item label's unfitted text and fit, with the room it was fitted into, so a state's stroke can re-fit it. */
export interface ItemLabelSource extends ItemLabelRoom {
    text: NormalisedTextOrSegments;
    fit: LabelFit;
}

/** {@link ItemLabelRoom} re-measured for a drawn stroke, and how far an anchored label moves with its end. */
export interface ItemLabelRefit {
    width: number;
    height: number;
    shiftX: number;
    shiftY: number;
}

/** Writes `room` re-measured for the drawn stroke into `out`; `false`, leaving `out` alone, when no edge moves. */
export function refitItemLabelRoom(
    room: ItemLabelRoom,
    stroke: unknown,
    strokeWidth: number | undefined,
    out: ItemLabelRefit
): boolean {
    const inset = itemContentInset(room.padding, itemStrokeDepth(stroke, strokeWidth, room.centred));
    const delta = inset - room.inset;
    if (delta === 0) return false;
    const anchored = itemEdgeInset(inset, room.spacing) - itemEdgeInset(room.inset, room.spacing);
    out.width = Math.max(0, room.width - delta - (room.anchorX === 0 ? delta : anchored));
    out.height = Math.max(0, room.height - delta - (room.anchorY === 0 ? delta : anchored));
    out.shiftX = room.anchorX * anchored;
    out.shiftY = room.anchorY * anchored;
    return true;
}

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
    const { startAngle, endAngle, innerRadius, outerRadius, radialEdgeInset = 0 } = sector;
    const outer = Math.max(0, Math.abs(outerRadius) - itemPadding);
    // A ring thinner than twice the padding closes up rather than turning inside out.
    if (innerRadius > 0) sector.innerRadius = Math.min(innerRadius + itemPadding, outer);
    // A sector drawn with a negative radius keeps its sign, and moves in by the same distance.
    sector.outerRadius = Math.sign(outerRadius) * outer;
    if (!isFullSweep(startAngle, endAngle)) sector.radialEdgeInset = radialEdgeInset + itemPadding;
    return sector;
}
