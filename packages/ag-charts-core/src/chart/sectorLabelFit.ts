import type { PaddingOptions } from 'ag-charts-types';

import { isArray } from '../data/typeGuards';
import { sectorLabelContainer } from '../geometry/barLabelGeometry';
import { type FitRegion, ReusableInsetRegion, probedFitRegion, regionTextCapacity } from '../geometry/fitRegion';
import type { LabelFitDescriptor, PlacedFit } from '../geometry/labelPlacement';
import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { cachedTextMeasurer, measureLabelText, resolvePadding } from '../rendering/textMeasurer';
import { BBox } from '../scene/bbox';
import { Text, type TextBoxingProperties } from '../scene/shape/text';
import {
    type SectorBoundaries,
    SectorPointTester,
    areLineBoxesInSector,
    isBoxInSector,
    isPointInSector,
    sectorColumnTest,
} from '../scene/util/sector';
import { toTextString } from '../text/textUtil';
import {
    type LabelFit,
    type OverflowPlacement,
    type PreparedRegionWrap,
    drawnLineHeight,
    findLargestFontSizeDescending,
    fontWithSize,
    isErased,
    keptContent,
    lostContent,
    placePreparedText,
    prepareTextToRegion,
    resolveMinimumFontSize,
    showsContent,
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
function furthestInside(limit: number, inside: (t: number) => boolean, knownInside = -1, knownOutside = Infinity) {
    let lo = 0;
    let hi = limit;
    for (let i = 0; i < SECTOR_BISECTION_STEPS; i += 1) {
        const t = (lo + hi) / 2;
        // OPTIMIZATION: a probe where the caller already knows the answer skips the test.
        if (t <= knownInside || (t < knownOutside && inside(t))) {
            lo = t;
        } else {
            hi = t;
        }
    }
    return lo;
}

/**
 * Rectangle a horizontal label fills in an origin-centred wedge, centred on the room the wedge offers rather than
 * hugging one radial edge. A known wrapped `block` that fits on the anchor stays there, as the sector nominates it.
 */
export function fitSectorLabelRect(
    anchor: Point,
    sector: SectorBoundaries,
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
    const { contains, insideUntil, outsideFrom } = rectTester.reset(sector);
    const limit = Math.abs(sector.outerRadius) * 2;
    // Furthest an edge through corners A and B can slide along (dirX, dirY) while both corners stay in the wedge.
    const reach = (ax: number, ay: number, bx: number, by: number, dirX: number, dirY: number) => {
        const aUntil = insideUntil(ax, ay, dirX, dirY, limit);
        const bUntil = insideUntil(bx, by, dirX, dirY, limit);
        return furthestInside(
            limit,
            (t) =>
                (t <= aUntil || contains(ax + dirX * t, ay + dirY * t)) &&
                (t <= bUntil || contains(bx + dirX * t, by + dirY * t)),
            Math.min(aUntil, bUntil),
            Math.min(outsideFrom(ax, ay, dirX, dirY, limit), outsideFrom(bx, by, dirX, dirY, limit))
        );
    };
    // Clearance for the box's leading edges (kept at the final size), then recentre on the room found.
    const right = reach(anchor.x, anchor.y - halfHeight, anchor.x, anchor.y + halfHeight, 1, 0);
    const left = reach(anchor.x, anchor.y - halfHeight, anchor.x, anchor.y + halfHeight, -1, 0);
    const centerX = anchor.x + (right - left) / 2;
    const down = reach(centerX - halfWidth, anchor.y, centerX + halfWidth, anchor.y, 0, 1);
    const up = reach(centerX - halfWidth, anchor.y, centerX + halfWidth, anchor.y, 0, -1);
    return { centerX, centerY: anchor.y + (down - up) / 2, width, height };
}

// Two bands whose widths are within this many px count as equally wide, so the tie-break toward the band
// furthest from the centre decides between them rather than sub-pixel noise.
const SECTOR_WIDTH_TOLERANCE = 2;
const BAND_STEPS = 48;

/** True when a box of `block`'s size centred on `anchor` passes the wedge test the visibility gate applies. */
function fitsOnAnchor(anchor: Point, sector: SectorBoundaries, { width, height }: BlockSize) {
    const box = { x: anchor.x - width / 2, y: anchor.y - height / 2, width, height };
    return isBoxInSector(box, sector);
}

/**
 * The wedge's horizontal extent at each of {@link BAND_STEPS} vertical centres, for a band `height` tall:
 * the box at each spans the extent common to the band's top and bottom edges (convex wedge, so those edges
 * bind) searched outward from the bisector with {@link isPointInSector}. Seeded from the bisector, so an
 * anchor on the chart's centre has no ray to seed from and must be excluded by the caller.
 */
function sectorBands(anchor: Point, sector: SectorBoundaries, height: number) {
    const radius = Math.hypot(anchor.x, anchor.y);
    const midCos = anchor.x / radius;
    const midSin = anchor.y / radius;
    const outer = sector.outerRadius;
    const halfHeight = height / 2;
    const limit = outer * 2;
    const { contains: inWedge, insideUntil, outsideFrom } = bandTester.reset(sector);
    // Furthest the bisector-seed on line `y` can slide along `dir` (±1 in x) while staying in the wedge.
    const edge = (seedX: number, y: number, dir: -1 | 1) =>
        seedX +
        dir *
            furthestInside(
                limit,
                (t) => inWedge(seedX + dir * t, y),
                insideUntil(seedX, y, dir, 0, limit),
                outsideFrom(seedX, y, dir, 0, limit)
            );
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
            if (!inWedge(seedX, y)) {
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
    const { bands } = sectorBands(anchor, sector, lineHeight);
    const step = (2 * sector.outerRadius) / BAND_STEPS;
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
    sector: SectorBoundaries,
    height: number,
    blockWidth?: number
): SectorLabelRect | null {
    const radius = Math.hypot(anchor.x, anchor.y);
    if (radius < 1e-6) {
        return null;
    }
    const { bands, maxWidth } = sectorBands(anchor, sector, height);
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

type WedgeLabelLayout = (placed: PlacedSectorLabel, font: FontOptions) => readonly BBox[];

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
        return node.getDrawnBoxes();
    };
}

/**
 * Longest vertical segment the sector could hold, ignoring its hole, as the longest one in the kite of its centre,
 * its arc's ends and the meeting point of their tangents, which holds the sector; `Infinity` past a quarter turn.
 */
function maxVerticalChord({ startAngle, endAngle, innerRadius, outerRadius }: SectorBoundaries) {
    const sweep = Math.abs(endAngle - startAngle);
    if (Number.isNaN(sweep) || sweep > Math.PI / 2) return Infinity;
    const radius = Math.max(0, innerRadius, outerRadius);
    const mid = (startAngle + endAngle) / 2;
    const tip = radius / Math.cos(sweep / 2);
    kiteX[1] = radius * Math.cos(startAngle);
    kiteY[1] = radius * Math.sin(startAngle);
    kiteX[2] = tip * Math.cos(mid);
    kiteY[2] = tip * Math.sin(mid);
    kiteX[3] = radius * Math.cos(endAngle);
    kiteY[3] = radius * Math.sin(endAngle);
    // The chord's length is concave across a convex polygon, so it peaks above a vertex.
    let longest = 0;
    for (let v = 0; v < 4; v += 1) {
        const x = kiteX[v];
        let low = Infinity;
        let high = -Infinity;
        for (let i = 0; i < 4; i += 1) {
            const x0 = kiteX[i];
            const y0 = kiteY[i];
            const x1 = kiteX[(i + 1) % 4];
            const y1 = kiteY[(i + 1) % 4];
            if (x < Math.min(x0, x1) || x > Math.max(x0, x1)) continue;
            const y = x0 === x1 ? y0 : y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
            low = Math.min(low, y, x0 === x1 ? y1 : y);
            high = Math.max(high, y, x0 === x1 ? y1 : y);
        }
        longest = Math.max(longest, high - low);
    }
    return longest;
}

// OPTIMIZATION: the kite's corners, the centre first, refilled by each maxVerticalChord call.
const kiteX = new Float64Array(4);
const kiteY = new Float64Array(4);

/**
 * True when no line of plain text in `font` can pass the gate in `sector`, however it is wrapped or placed: every
 * line box is a line tall (canvas font metrics belong to the font, not the string), less any negative box padding,
 * and a box whose corners pass the wedge test spans a vertical chord that long, which the sector does not have.
 */
function holdsNoLine(sector: SectorBoundaries, font: FontOptions, boxing: TextBoxingProperties) {
    const { lineHeight } = font;
    // A zero or non-finite line height leaves rows a node draws with no height of their own.
    if (lineHeight != null && !(lineHeight > 0 && Number.isFinite(lineHeight))) return false;
    const boxed = boxing.fill != null || (boxing.border?.enabled === true && boxing.border.stroke != null);
    const boxPadding = resolvePadding(boxed ? boxing.padding : undefined);
    const shortest = drawnLineHeight(font) + Math.min(0, boxPadding.top) + Math.min(0, boxPadding.bottom);
    // The margin outweighs any rounding in the corners the gate tests.
    const margin = 1e-6 * (Math.max(0, sector.innerRadius, sector.outerRadius) + shortest);
    return maxVerticalChord(sector) < shortest - margin;
}

/** A probed wedge: the rect and region for a line height and block, and the wraps worked out in it at the floor. */
interface WedgeProbe {
    lineHeight: number;
    block?: BlockSize;
    rect: SectorLabelRect;
    region: FitRegion;
    /** The font the kept wraps were worked out for, the latest wrap's clearance, and the wrap itself. */
    preparedFor?: FontOptions;
    preparedInset?: number;
    prepared?: PreparedRegionWrap;
    /** Every clearance's wrap, once a second one is kept; most labels never retry, so most never need it. */
    preparedByInset?: Map<number, PreparedRegionWrap>;
}

function preparedAt(probe: WedgeProbe, sized: FontOptions, inset: number) {
    if (probe.preparedFor !== sized) return undefined;
    return probe.preparedInset === inset ? probe.prepared : probe.preparedByInset?.get(inset);
}

function keepPrepared(probe: WedgeProbe, sized: FontOptions, inset: number, prepared: PreparedRegionWrap) {
    if (probe.preparedFor !== sized) {
        probe.preparedFor = sized;
        probe.preparedByInset = undefined;
    } else if (probe.prepared != null) {
        probe.preparedByInset ??= new Map();
        probe.preparedByInset.set(probe.preparedInset!, probe.prepared);
        probe.preparedByInset.set(inset, prepared);
    }
    probe.preparedInset = inset;
    probe.prepared = prepared;
}

/** Whether two placements of plain text lay out alike; segment arrays are not compared. */
function samePlacement(a: PlacedSectorLabel, b: PlacedSectorLabel) {
    return typeof a.text === 'string' && a.text === b.text && a.x === b.x && a.y === b.y;
}

function sameBlock(a: BlockSize | undefined, b: BlockSize | undefined) {
    if (a == null || b == null) return a === b;
    return a.width === b.width && a.height === b.height;
}

/** A plain fixed-size label whose padded single line the wedge holds at the anchor, where the full fit settles. */
function placeOnAnchor(
    text: NormalisedTextOrSegments,
    fit: LabelFit,
    font: FontOptions,
    anchor: Point,
    sector: SectorBoundaries,
    wedge: SectorPointTester,
    padding: Required<PaddingOptions>,
    layout: WedgeLabelLayout
): PlacedSectorLabel | undefined {
    // A width or height bound can wrap a line the wedge would hold, so only the wedge may bound an accepted one.
    if (isArray(text) || fit.maxWidth != null || fit.maxHeight != null) return undefined;
    // Past a half turn the wedge is not convex, so the full fit may move a label its anchor holds.
    if (Math.abs(sector.endAngle - sector.startAngle) > Math.PI) return undefined;
    if (resolveMinimumFontSize(fit.minimumFontSize, font.fontSize) < font.fontSize) return undefined;
    const line = toTextString(text);
    // A line break lays out as more than one line, which the anchor never holds.
    if (LINE_BREAK.test(line)) return undefined;
    // OPTIMIZATION: the drawn box holds the line across the anchor, so an end of it clear of the wedge rejects unlaid.
    const half = cachedTextMeasurer(font).measureText(line.trim()).width / 2;
    const scale = Math.abs(anchor.x) + Math.abs(anchor.y) + 2 * half;
    if (wedge.isClear(anchor.x - half, anchor.y, scale) || wedge.isClear(anchor.x + half, anchor.y, scale))
        return undefined;
    const placed = { text, x: anchor.x, y: anchor.y };
    const boxes = layout(placed, font);
    // The gate re-lays the label out at these same coordinates, so its own test on these boxes is what accepts.
    if (boxes.length !== 1 || !areLineBoxesInSector(boxes, sector)) return undefined;
    // The fit insets the wedge by the larger padding of each pair on both sides, so the box is held to that too.
    const box = boxes[0];
    const padX = Math.max(padding.left, padding.right);
    const padY = Math.max(padding.top, padding.bottom);
    // Unpadded, the held box is the laid-out one, which the gate's test has just accepted.
    if (Object.is(padX, 0) && Object.is(padY, 0)) return placed;
    heldBox.x = box.x - padX;
    heldBox.y = box.y - padY;
    heldBox.width = box.width + 2 * padX;
    heldBox.height = box.height + 2 * padY;
    return isBoxInSector(heldBox, sector) ? placed : undefined;
}

// OPTIMIZATION: one point tester per role, reset for each label rather than built afresh.
const wedgeTester = new SectorPointTester();
const rectTester = new SectorPointTester();
const bandTester = new SectorPointTester();

// OPTIMIZATION: scratch for placeOnAnchor's padded box, which it tests once per label.
const heldBox = { x: 0, y: 0, width: 0, height: 0 };
// OPTIMIZATION: one inset region per clearance, kept across a label's passes while the region it insets stands,
// so a pass asking for bands another pass worked out reads them; all are released once the label is placed.
const wedgeInsets = new Map<number, { region: ReusableInsetRegion; of?: FitRegion; label: number }>();
// Counts the labels placed, so a region inset for an earlier label is never read as this one's.
let wedgeLabel = 0;
// Whether any pooled region has been reset since the last release; a label its anchor holds touches none.
let wedgeInsetsHeld = false;

function wedgeInset(inset: number, of: FitRegion, dx: number, dy: number) {
    wedgeInsetsHeld = true;
    let entry = wedgeInsets.get(inset);
    if (entry == null) {
        entry = { region: new ReusableInsetRegion(), label: wedgeLabel };
        wedgeInsets.set(inset, entry);
    }
    if (entry.of !== of || entry.label !== wedgeLabel) {
        entry.region.reset(of, dx, dy);
        entry.of = of;
        entry.label = wedgeLabel;
    }
    return entry.region;
}

function releaseWedgeInsets() {
    if (!wedgeInsetsHeld) return;
    wedgeInsetsHeld = false;
    for (const entry of wedgeInsets.values()) {
        entry.region.release();
        entry.of = undefined;
    }
}
const LINE_BREAK = /\r?\n/;
const NOT_IN_WEDGE: { placed: PlacedSectorLabel; inWedge: boolean } = {
    placed: { text: '', x: 0, y: 0 },
    inWedge: false,
};

/** The wedge's usable region depends on the line height and block, so it is probed again whenever either changes. */
function fitSectorLabelToWedge(
    text: NormalisedTextOrSegments,
    fit: LabelFit,
    font: FontOptions,
    anchor: Point,
    sector: SectorBoundaries,
    padding: Required<PaddingOptions>,
    boxing: TextBoxingProperties,
    layout: WedgeLabelLayout,
    drawnAsFitted: boolean
): PlacedSectorLabel {
    // The series hides any placement a wedge this thin gets, so none is made, unless the node may be drawn in
    // another style than the one this proves against.
    const holdsNone = (sized: FontOptions) => drawnAsFitted && !isArray(text) && holdsNoLine(sector, sized, boxing);
    const floor = resolveMinimumFontSize(fit.minimumFontSize, font.fontSize);
    if (floor >= font.fontSize && holdsNone(font)) return NOT_IN_WEDGE.placed;
    const inSector = wedgeTester.reset(sector).contains;
    const onAnchor = placeOnAnchor(text, fit, font, anchor, sector, wedgeTester, padding, layout);
    if (onAnchor != null) return onAnchor;
    const holdsColumn = sectorColumnTest(sector);
    const probe = (lineHeight: number, block: BlockSize | undefined): WedgeProbe => {
        const rect = fitSectorLabelRect(anchor, sector, lineHeight, block);
        const at = { x: rect.centerX, y: rect.centerY };
        const region = probedFitRegion(at, inSector, Math.abs(sector.outerRadius) * 2, holdsColumn, wedgeTester);
        return { lineHeight, block, rect, region };
    };
    // Every pass starts from the estimated block, so its probe is kept apart from the one for a measured block.
    let unblocked: WedgeProbe | undefined;
    let blocked: WedgeProbe | undefined;
    const probeFor = (lineHeight: number, block: BlockSize | undefined) => {
        if (block == null) {
            if (unblocked?.lineHeight !== lineHeight) unblocked = probe(lineHeight, undefined);
            return unblocked;
        }
        if (blocked?.lineHeight !== lineHeight || !sameBlock(blocked.block, block)) blocked = probe(lineHeight, block);
        return blocked;
    };
    wedgeLabel += 1;
    const padX = Math.max(padding.left, padding.right);
    const padY = Math.max(padding.top, padding.bottom);
    const place = (
        sized: FontOptions,
        atFloor: boolean,
        overflow: OverflowPlacement,
        inset: number,
        block: BlockSize | undefined
    ) => {
        const lineHeight = drawnLineHeight(sized);
        const probed = probeFor(lineHeight, block);
        const { rect } = probed;
        const region = wedgeInset(inset, probed.region, padX + inset, padY + inset);
        // The region bounds the text the same way the wedge does but for the block's own place in it,
        // padding included, so it refuses what the wedge-wide bounds let through — still before any layout.
        if (!atFloor && measureLabelText(text, sized).width > regionTextCapacity(region, lineHeight)) {
            return undefined;
        }
        // Above the floor the text must fit whole, so a truncating size is rejected and the search steps down.
        const policy = atFloor ? fit : { ...fit, overflowStrategy: 'hide' as const };
        // An anchored rect is the block's place, so the fit must not take a horizontal offset to exploit
        // room on one side: the text would be wrapped for bands it is then not drawn in.
        // At the floor every pass wraps alike and differs only past the wedge, so they share one wrap per clearance.
        let prepared = atFloor ? preparedAt(probed, sized, inset) : undefined;
        if (prepared == null) {
            prepared = prepareTextToRegion(text, policy, region, sized, rect.anchored);
            if (atFloor) keepPrepared(probed, sized, inset, prepared);
        }
        const fitted = placePreparedText(prepared, overflow);
        return {
            placed: { text: fitted.text, x: rect.centerX + fitted.offsetX, y: rect.centerY + fitted.offsetY },
            rectHeight: rect.height,
        };
    };
    // The region samples the wedge rather than proving it, so each placement is checked on the node and re-placed
    // with more clearance, or for the block size it turned out to be.
    const placeInWedgeAs = (sized: FontOptions, atFloor: boolean, overflow: OverflowPlacement) => {
        let inset = 0;
        let block: BlockSize | undefined;
        const first = place(sized, atFloor, overflow, inset, block);
        if (first == null) {
            return { placed: { text: '', x: 0, y: 0 }, inWedge: false };
        }
        let { placed, rectHeight } = first;
        // Re-placing trades one shape of room for another, so the passes are candidates rather than
        // refinements: the one keeping the most text wins, and only a placement drawn inside the wedge can.
        let best: PlacedSectorLabel | undefined;
        let bestKept = 0;
        let laid: PlacedSectorLabel | undefined;
        let laidBoxes: readonly BBox[] = [];
        for (let attempt = 0; attempt < MAX_WEDGE_ATTEMPTS && showsContent(placed.text); attempt += 1) {
            // More clearance often places the same text in the same spot, which lays out as it did before.
            const boxes = laid != null && samePlacement(laid, placed) ? laidBoxes : layout(placed, sized);
            laid = placed;
            laidBoxes = boxes;
            const inWedge = areLineBoxesInSector(boxes, sector);
            const kept = inWedge ? keptContent(placed.text) : 0;
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
            const next = place(sized, atFloor, overflow, inset, block);
            if (next == null) {
                break;
            }
            ({ placed, rectHeight } = next);
        }
        // A wedge too narrow for one character leaves a bare ellipsis, which reads as an artefact rather
        // than a label, so it is dropped outright instead of appearing and vanishing as the chart resizes.
        const chosen = best ?? placed;
        const kept = showsContent(chosen.text) ? chosen.text : '';
        return { placed: { ...chosen, text: kept }, inWedge: best != null };
    };
    // Placed as before; a preserved label that lost text is then hung, else centred, past the wedge.
    const placeInWedge = (sized: FontOptions, atFloor: boolean) => {
        if (holdsNone(sized)) return NOT_IN_WEDGE;
        const placed = placeInWedgeAs(sized, atFloor, 'none');
        if (!atFloor || fit.overflowStrategy != null || !lostContent(text, placed.placed.text)) return placed;
        const hung = placeInWedgeAs(sized, atFloor, 'hang');
        if (hung.inWedge) return hung;
        const centred = placeInWedgeAs(sized, atFloor, 'centre');
        return centred.inWedge ? centred : hung;
    };
    if (floor >= font.fontSize) return placeInWedge(font, true).placed;
    // Measured at the smallest line height in play, so it bounds the room at every size on the ladder.
    const room = sectorLabelRoom(anchor, sector, drawnLineHeight(fontWithSize(font, floor)));
    // The floor rung is always placed, so its placement is the fallback rather than placed twice.
    let atFloorPlaced: PlacedSectorLabel | undefined;
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
        if (atFloor) atFloorPlaced = placed;
        if (!inWedge || isErased(placed.text)) return undefined;
        return { ...placed, fontSize: fontSize === font.fontSize ? undefined : fontSize };
    });
    return found ?? atFloorPlaced!;
}

/**
 * Places a fitted sector label in its wedge, as a candidate fit target's `place`: `anchor` and `sector` are
 * relative to the series centre at `(centreX, centreY)`, and the label is drawn centred on the point it reports.
 * `drawnAsFitted` is true when the label's node is always drawn in the font and boxing it is fitted in, as it is
 * without a state-dependent style.
 */
export function sectorLabelPlacer(
    anchor: Point,
    sector: SectorBoundaries,
    padding: Required<PaddingOptions>,
    boxing: TextBoxingProperties,
    centreX: number,
    centreY: number,
    drawnAsFitted = false
): (fit: LabelFitDescriptor) => PlacedFit | undefined {
    return (fit) => {
        const layout = wedgeLabelLayout(boxing);
        let placed: PlacedSectorLabel;
        try {
            placed = fitSectorLabelToWedge(
                fit.text,
                fit.policy,
                fit.font,
                anchor,
                sector,
                padding,
                boxing,
                layout,
                drawnAsFitted
            );
        } finally {
            releaseWedgeInsets();
            // Segments hold the label's objects; a string holds none, and resetting it fires change detection.
            if (isArray(wedgeNode!.text)) wedgeNode!.text = '';
        }
        if (!showsContent(placed.text)) return undefined;
        return { text: placed.text, x: centreX + placed.x, y: centreY + placed.y, fontSize: placed.fontSize };
    };
}
