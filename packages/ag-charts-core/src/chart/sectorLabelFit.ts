import type { PaddingOptions } from 'ag-charts-types';

import { sectorLabelContainer } from '../geometry/barLabelGeometry';
import { insetFitRegion, probedFitRegion, regionTextCapacity } from '../geometry/fitRegion';
import type { LabelFitDescriptor, PlacedFit } from '../geometry/labelPlacement';
import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { measureLabelText } from '../rendering/textMeasurer';
import { BBox } from '../scene/bbox';
import { Text, type TextBoxingProperties } from '../scene/shape/text';
import { type SectorBoundaries, isBoxInSector, isPointInSector } from '../scene/util/sector';
import {
    type LabelFit,
    drawnLineHeight,
    findLargestFontSizeDescending,
    fitLabelTextToRegion,
    fontWithSize,
    hasRealChars,
    isErased,
    keptCharacters,
    resolveMinimumFontSize,
    withFitRegion,
} from '../text/textWrapper';
import type { Point } from '../types/scene';
import type { FontOptions } from '../types/text';

/** Placement and size of the rectangle a horizontal sector label fits into. */
export interface SectorLabelRect {
    /** Centre of the inscribed rectangle — where the horizontal label sits. */
    readonly centerX: number;
    readonly centerY: number;
    /** Room the label may use at that centre: the wedge's own width there, not the text's. */
    readonly width: number;
    /** The block's height — as measured by the caller when it supplied one, estimated from one line if not. */
    readonly height: number;
    /** The block fits centred on the anchor, so a caller must not recentre it on the room it found. */
    readonly anchored?: boolean;
}

/** Size a sector label's text actually wrapped to, as measured on the node that will draw it. */
export interface BlockSize {
    readonly width: number;
    readonly height: number;
}

// A box taller than one line by this ratio is treated as multi-line and fitted to a horizontal band
// (see centreSectorLabelInBand) rather than slid symmetrically about the bisector.
const SECTOR_MULTILINE_HEIGHT_RATIO = 1.5;
// Binary-search iterations for the sector edge probes below; ~24 halvings resolves sub-pixel on any radius.
const SECTOR_BISECTION_STEPS = 24;

/** Largest `t` in `[0, limit]` for which `inside(t)` still holds, by binary search (`inside` is monotone false-ward). */
function furthestInside(limit: number, inside: (t: number) => boolean): number {
    let lo = 0;
    let hi = limit;
    for (let i = 0; i < SECTOR_BISECTION_STEPS; i += 1) {
        const t = (lo + hi) / 2;
        if (inside(t)) {
            lo = t;
        } else {
            hi = t;
        }
    }
    return lo;
}

/**
 * Rectangle a horizontal label should fill inside an origin-centred annular wedge. {@link sectorLabelContainer}
 * sizes a box that fits the wedge centred on `anchor`, but a horizontal label is not symmetric about the sector
 * bisector, so that box hugs one side. Keeping the (safe) size, we slide it to the middle of the room the wedge
 * actually offers on each axis — probed with {@link isPointInSector} — so the label sits centred both ways
 * instead of against an edge. `lineHeight` seeds the size search with a single line's height.
 *
 * A multi-line box spans a radial band whose width varies with height, so sizing it symmetrically about the
 * bisector caps its width at the nearer radial edge and the slide above cannot recover the room the far side
 * offers — the label ends up hugging one edge. Such a box is instead fitted to the wedge's true horizontal
 * extent across its own band (see {@link centreSectorLabelInBand}); the symmetric slide is kept for
 * single-line boxes, whose thin band cannot exhibit this.
 *
 * `block` replaces the estimated size once the caller knows what its text wrapped to: a block sized from one
 * line is placed where a thin box fits, which is not where the block it grew into belongs. A block that fits
 * on the anchor stays on it — the sector nominates that point for its label, and both searches below trade
 * centring for room a block this size does not need.
 */
export function fitSectorLabelRect(
    anchor: Point,
    sector: { startAngle: number; endAngle: number; innerRadius: number; outerRadius: number },
    lineHeight: number,
    block?: BlockSize
): SectorLabelRect {
    const container = sectorLabelContainer(anchor, sector, lineHeight);
    const width = container.width;
    const height = block?.height ?? container.height;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    if (halfWidth <= 0 || halfHeight <= 0 || !isPointInSector(anchor.x, anchor.y, sector)) {
        return { centerX: anchor.x, centerY: anchor.y, width, height };
    }
    if (block != null && fitsOnAnchor(anchor, sector, block)) {
        return { centerX: anchor.x, centerY: anchor.y, width, height, anchored: true };
    }
    if (height > lineHeight * SECTOR_MULTILINE_HEIGHT_RATIO) {
        const centred = centreSectorLabelInBand(anchor, sector, height, block?.width);
        if (centred != null) {
            return centred;
        }
    }
    const contains = (x: number, y: number) => isPointInSector(x, y, sector);
    const limit = Math.abs(sector.outerRadius) * 2;
    // Furthest an edge through corners A and B can slide along (dirX, dirY) while both corners stay in the wedge.
    const reach = (ax: number, ay: number, bx: number, by: number, dirX: number, dirY: number) =>
        furthestInside(limit, (t) => contains(ax + dirX * t, ay + dirY * t) && contains(bx + dirX * t, by + dirY * t));
    // Clearance for the box's leading edges (kept at the final size), then recentre on the room found.
    const right = reach(anchor.x, anchor.y - halfHeight, anchor.x, anchor.y + halfHeight, 1, 0);
    const left = reach(anchor.x, anchor.y - halfHeight, anchor.x, anchor.y + halfHeight, -1, 0);
    const centerX = anchor.x + (right - left) / 2;
    const down = reach(centerX - halfWidth, anchor.y, centerX + halfWidth, anchor.y, 0, 1);
    const up = reach(centerX - halfWidth, anchor.y, centerX + halfWidth, anchor.y, 0, -1);
    return { centerX, centerY: anchor.y + (down - up) / 2, width, height };
}

// Radial slack (px) kept between the placed box and the wedge's arcs, so a box corner rounded outward by
// floating error still passes the visibility gate that hides overflowing sector labels.
const SECTOR_ARC_INSET = 0.75;
// Two bands whose widths are within this many px count as equally wide, so the tie-break toward the band
// furthest from the centre decides between them rather than sub-pixel noise.
const SECTOR_WIDTH_TOLERANCE = 2;
const BAND_STEPS = 48;

/** Sector shrunk radially by {@link SECTOR_ARC_INSET}, so a box it accepts also clears the drawn arcs. */
function arcInsetSector(sector: SectorBoundaries): SectorBoundaries {
    return {
        startAngle: sector.startAngle,
        endAngle: sector.endAngle,
        innerRadius: sector.innerRadius > 0 ? sector.innerRadius + SECTOR_ARC_INSET : 0,
        outerRadius: Math.abs(sector.outerRadius) - SECTOR_ARC_INSET,
    };
}

/** True when a box of `block`'s size centred on `anchor` lies inside the wedge, clear of its arcs. */
function fitsOnAnchor(anchor: Point, sector: SectorBoundaries, { width, height }: BlockSize) {
    const box = { x: anchor.x - width / 2, y: anchor.y - height / 2, width, height };
    return isBoxInSector(box, arcInsetSector(sector));
}

/**
 * The wedge's horizontal extent at each of {@link BAND_STEPS} vertical centres, for a band `height` tall:
 * the box at each spans the extent common to the band's top and bottom edges (convex wedge, so those edges
 * bind) searched outward from the bisector with {@link isPointInSector}. Seeded from the bisector, so an
 * anchor on the chart's centre has no ray to seed from and must be excluded by the caller.
 */
function sectorBands(anchor: Point, inset: SectorBoundaries, height: number) {
    const radius = Math.hypot(anchor.x, anchor.y);
    const midCos = anchor.x / radius;
    const midSin = anchor.y / radius;
    const outer = inset.outerRadius;
    const halfHeight = height / 2;
    const limit = outer * 2;
    // Furthest the bisector-seed on line `y` can slide along `dir` (±1 in x) while staying in the wedge.
    const edge = (seedX: number, y: number, dir: -1 | 1) =>
        seedX + dir * furthestInside(limit, (t) => isPointInSector(seedX + dir * t, y, inset));
    // Seed each line from the point where the bisector ray crosses it, guaranteed inside where the ray reaches.
    const seedAt = (y: number) => (Math.abs(midSin) > 1e-3 ? (y * midCos) / midSin : anchor.x);

    const bands: SectorLabelRect[] = [];
    let maxWidth = 0;
    for (let i = 0; i <= BAND_STEPS; i += 1) {
        const centerY = -outer + (2 * outer * i) / BAND_STEPS;
        let left = -Infinity;
        let right = Infinity;
        let fits = true;
        for (const y of [centerY - halfHeight, centerY + halfHeight]) {
            const seedX = seedAt(y);
            if (!isPointInSector(seedX, y, inset)) {
                fits = false;
                break;
            }
            left = Math.max(left, edge(seedX, y, -1));
            right = Math.min(right, edge(seedX, y, 1));
        }
        if (!fits || right <= left) {
            continue;
        }
        const width = right - left;
        bands.push({ centerX: (left + right) / 2, centerY, width, height });
        maxWidth = Math.max(maxWidth, width);
    }
    return { bands, maxWidth };
}

/** Bounds on the text a wedge can hold, for a caller sizing a label before it lays any text out. */
export interface SectorLabelRoom {
    /** Total room the wedge's bands add up to. */
    readonly area: number;
    /** Widest total advance the wedge could hold at `lineHeight`, stacking as many whole lines as it fits. */
    capacityAt(lineHeight: number): number;
}

/**
 * The room a wedge offers a label, measured band by band for a band `lineHeight` tall. Both bounds are
 * generous — a band is wider than the text centred in it, wrapping on words costs width they do not charge
 * for, and a band measured for a short line is never narrower than a taller line would get — so text
 * exceeding either cannot fit however it wraps, which is what makes them safe to reject a font size on.
 */
export function sectorLabelRoom(anchor: Point, sector: SectorBoundaries, lineHeight: number): SectorLabelRoom {
    if (Math.hypot(anchor.x, anchor.y) < 1e-6) {
        // No bisector to seed the bands from, so the wedge goes unmeasured and no font size is rejected.
        return { area: Infinity, capacityAt: () => Infinity };
    }
    const inset = arcInsetSector(sector);
    const { bands } = sectorBands(anchor, inset, lineHeight);
    const step = (2 * inset.outerRadius) / BAND_STEPS;
    const widest = bands.map((band) => band.width).toSorted((a, b) => b - a);
    return {
        area: widest.reduce((total, width) => total + width * step, 0),
        capacityAt: (height: number) =>
            widest.slice(0, Math.floor((widest.length * step) / height)).reduce((total, width) => total + width, 0),
    };
}

/**
 * Fits a multi-line sector label to one of the wedge's bands. A tall box measured symmetrically about the
 * bisector is capped by the nearer radial edge and left hugging it, so a band — centred between the wedge's
 * sides — is chosen instead. Returns `null` when no band holds the box (e.g. one nearly as tall as the
 * radius), so the caller falls back to symmetric placement.
 *
 * Of the bands that hold `blockWidth` — the width the text actually wrapped to — the one nearest `anchor`
 * wins, so a label sits on the point the sector nominates for it and moves only as far as it must to fit.
 * Without a wrapped width to answer to, the widest band wins instead, the furthest out among equals.
 */
function centreSectorLabelInBand(
    anchor: Point,
    sector: { startAngle: number; endAngle: number; innerRadius: number; outerRadius: number },
    height: number,
    blockWidth?: number
): SectorLabelRect | null {
    const radius = Math.hypot(anchor.x, anchor.y);
    if (radius < 1e-6) {
        return null;
    }
    // Probe against arc-inset radii so the chosen box clears the arcs by SECTOR_ARC_INSET on both sides.
    const { bands, maxWidth } = sectorBands(anchor, arcInsetSector(sector), height);
    if (blockWidth != null) {
        const nearest = nearestBandHolding(bands, anchor, Math.min(blockWidth, maxWidth) - SECTOR_WIDTH_TOLERANCE);
        if (nearest != null) {
            return nearest;
        }
    }
    // Among the widest bands (within a tolerance), take the one furthest from the chart centre.
    let best: SectorLabelRect | null = null;
    let bestRadius = -Infinity;
    for (const band of bands) {
        if (band.width < maxWidth - SECTOR_WIDTH_TOLERANCE) {
            continue;
        }
        const bandRadius = Math.hypot(band.centerX, band.centerY);
        if (bandRadius > bestRadius) {
            best = band;
            bestRadius = bandRadius;
        }
    }
    return best;
}

/** Band at least `required` wide whose centre lies nearest `anchor`; `null` when none is wide enough. */
function nearestBandHolding(bands: SectorLabelRect[], anchor: Point, required: number): SectorLabelRect | null {
    let best: SectorLabelRect | null = null;
    let bestDistance = Infinity;
    for (const band of bands) {
        if (band.width < required) {
            continue;
        }
        const distance = Math.hypot(band.centerX - anchor.x, band.centerY - anchor.y);
        if (distance < bestDistance) {
            best = band;
            bestDistance = distance;
        }
    }
    return best;
}

/** Extra clearance (px) retried when a placement the region accepted still overruns the wedge once drawn. */
const WEDGE_RETRY_INSETS = [1, 2, 4, 8];
// Clearance retries plus the passes the block height needs to settle, which is one per line it ends with.
const MAX_WEDGE_ATTEMPTS = 8;
// Block and wedge heights within this many px are the same box; the fit rounds bands to whole lines.
const HEIGHT_CONVERGED = 1;

/** A sector label placed in its wedge: the fitted text, and where the text node has to draw it. */
interface PlacedSectorLabel {
    text: NormalisedTextOrSegments;
    x: number;
    y: number;
    fontSize?: number;
}

type WedgeLabelLayout = (placed: PlacedSectorLabel, font: FontOptions) => BBox[];

// Lays candidates out the way the label's own node will draw them, so the fit reads the boxes the
// visibility gate judges.
let wedgeNode: Text | undefined;

function wedgeLabelLayout(boxing: TextBoxingProperties): WedgeLabelLayout {
    wedgeNode ??= new Text();
    const node = wedgeNode;
    node.setAlign({ textAlign: 'center', textBaseline: 'middle' });
    node.setBoxing(boxing);
    return (placed, font) => {
        node.text = placed.text;
        node.x = placed.x;
        node.y = placed.y;
        node.setFont(font);
        return node.getLineBoxes();
    };
}

function sameBlock(a: BlockSize | undefined, b: BlockSize | undefined) {
    if (a == null || b == null) return a === b;
    return a.width === b.width && a.height === b.height;
}

/** The wedge's usable region depends on the line height, so every candidate size is placed and probed afresh. */
function fitSectorLabelToWedge(
    text: NormalisedTextOrSegments,
    fit: LabelFit,
    font: FontOptions,
    anchor: Point,
    sector: SectorBoundaries,
    padding: Required<PaddingOptions>,
    layout: (placed: PlacedSectorLabel, font: FontOptions) => BBox[]
): PlacedSectorLabel {
    const place = (sized: FontOptions, atFloor: boolean, inset: number, block: BlockSize | undefined) => {
        const lineHeight = drawnLineHeight(sized);
        const rect = fitSectorLabelRect(anchor, sector, lineHeight, block);
        const region = insetFitRegion(
            probedFitRegion(
                { x: rect.centerX, y: rect.centerY },
                (x, y) => isPointInSector(x, y, sector),
                Math.abs(sector.outerRadius) * 2
            ),
            Math.max(padding.left, padding.right) + inset,
            Math.max(padding.top, padding.bottom) + inset
        );
        // The region bounds the text the same way the wedge does but for the block's own place in it,
        // padding included, so it refuses what the wedge-wide bounds let through — still before any layout.
        if (!atFloor && measureLabelText(text, sized).width > regionTextCapacity(region, lineHeight)) {
            return undefined;
        }
        // Above the floor the text must fit whole, so a truncating size is rejected and the search steps down.
        const policy = atFloor ? fit : { ...fit, overflowStrategy: 'hide' as const };
        // An anchored rect is the block's place, so the fit must not take a horizontal offset to exploit
        // room on one side: the text would be wrapped for bands it is then not drawn in.
        const fitted = fitLabelTextToRegion(text, withFitRegion(policy, region), sized, rect.anchored);
        return {
            placed: { text: fitted.text, x: rect.centerX + fitted.offsetX, y: rect.centerY + fitted.offsetY },
            rectHeight: rect.height,
        };
    };
    /**
     * The wedge is sized for a block before its text has wrapped, and the region samples the wedge rather
     * than proving it, so each placement is measured on the node: one that overruns the wedge is re-fitted
     * with more clearance, and one whose block is not the size the wedge was sized for is placed again
     * for the size it turned out to be — a block only earns the anchor, or the band that suits it, once
     * its own width and height are known.
     */
    const placeInWedge = (sized: FontOptions, atFloor: boolean) => {
        let inset = 0;
        let block: BlockSize | undefined;
        const first = place(sized, atFloor, inset, block);
        if (first == null) {
            return { placed: { text: '', x: 0, y: 0 }, inWedge: false };
        }
        let { placed, rectHeight } = first;
        // Re-placing trades one shape of room for another, so the passes are candidates rather than
        // refinements: the one keeping the most text wins, and only a placement drawn inside the wedge can.
        let best: PlacedSectorLabel | undefined;
        let bestKept = 0;
        for (let attempt = 0; attempt < MAX_WEDGE_ATTEMPTS && hasRealChars(placed.text); attempt += 1) {
            const boxes = layout(placed, sized);
            const inWedge = boxes.every((box) => isBoxInSector(box, sector));
            const kept = inWedge ? keptCharacters(placed.text) : 0;
            // A later pass ties only by placing the same text better, so equal candidates prefer it.
            if (kept > 0 && kept >= bestKept) {
                best = placed;
                bestKept = kept;
            }
            const drawn = BBox.merge(boxes);
            if (inWedge && block != null && Math.abs(drawn.height - rectHeight) < HEIGHT_CONVERGED) {
                break;
            }
            const nextInset = inWedge ? inset : WEDGE_RETRY_INSETS[Math.min(attempt, WEDGE_RETRY_INSETS.length - 1)];
            const nextBlock = inWedge ? { width: drawn.width, height: drawn.height } : block;
            // Nothing the next placement reads has moved, so it would fit the same text in the same place.
            if (nextInset === inset && sameBlock(nextBlock, block)) {
                break;
            }
            inset = nextInset;
            block = nextBlock;
            const next = place(sized, atFloor, inset, block);
            if (next == null) {
                break;
            }
            ({ placed, rectHeight } = next);
        }
        // A wedge too narrow for one character leaves a bare ellipsis, which reads as an artefact rather
        // than a label, so it is dropped outright instead of appearing and vanishing as the chart resizes.
        const chosen = best ?? placed;
        const kept = hasRealChars(chosen.text) ? chosen.text : '';
        return { placed: { ...chosen, text: kept }, inWedge: best != null };
    };
    const floor = resolveMinimumFontSize(fit.minimumFontSize, font.fontSize);
    if (floor >= font.fontSize) return placeInWedge(font, true).placed;
    // Measured at the smallest line height in play, so it bounds the room at every size on the ladder.
    const room = sectorLabelRoom(anchor, sector, drawnLineHeight(fontWithSize(font, floor)));
    // A smaller size can reflow into a wider block, so the ladder is scanned down rather than bisected.
    const found = findLargestFontSizeDescending(floor, font.fontSize, (fontSize, atFloor) => {
        const sized = fontWithSize(font, fontSize);
        // The wedge cannot hold more text than it has room for, whether measured by the area the text
        // covers or by the lines the wedge can stack, so an oversized rung goes without being placed.
        const lineHeight = drawnLineHeight(sized);
        const advance = measureLabelText(text, sized).width;
        if (!atFloor && (advance * lineHeight > room.area || advance > room.capacityAt(lineHeight))) {
            return undefined;
        }
        const { placed, inWedge } = placeInWedge(sized, atFloor);
        if (!inWedge || isErased(placed.text)) return undefined;
        return { ...placed, fontSize: fontSize === font.fontSize ? undefined : fontSize };
    });
    return found ?? placeInWedge(fontWithSize(font, floor), true).placed;
}

/**
 * Places a fitted sector label in its wedge, as a candidate fit target's `place`: `anchor` and `sector` are
 * relative to the series centre at `(centreX, centreY)`, and the label is drawn centred on the point it reports.
 */
export function sectorLabelPlacer(
    anchor: Point,
    sector: SectorBoundaries,
    padding: Required<PaddingOptions>,
    boxing: TextBoxingProperties,
    centreX: number,
    centreY: number
): (fit: LabelFitDescriptor) => PlacedFit | undefined {
    return (fit) => {
        const layout = wedgeLabelLayout(boxing);
        const placed = fitSectorLabelToWedge(fit.text, fit.policy, fit.font, anchor, sector, padding, layout);
        if (!hasRealChars(placed.text)) return undefined;
        return { text: placed.text, x: centreX + placed.x, y: centreY + placed.y, fontSize: placed.fontSize };
    };
}
