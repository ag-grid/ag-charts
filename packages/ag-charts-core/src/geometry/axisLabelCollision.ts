import { isNumberEqual } from '../data/numbers';
import { type BoxBounds, boxCollides } from './boxBounds';

const DEFAULT_TICK_LABEL_SPACING = 10;

/** Gap kept between cartesian tick labels drawn turned by `rotation` radians: rotated labels pack edge to edge. */
export function tickLabelSpacing(threshold: number | undefined, rotation: number): number {
    return Math.cos(rotation) < 1 - 1e-9 ? 0 : (threshold ?? DEFAULT_TICK_LABEL_SPACING);
}

/**
 * A box grows its width and height by a positive `spacing`; a negative one lets it overlap another by up to that
 * much, measured along the direction the two are apart in.
 */
function labelBoxCollides(other: BoxBounds, { x, y, width, height }: BoxBounds, spacing: number): boolean {
    if (spacing >= 0) return boxCollides(other, x, y, width + spacing, height + spacing);
    const overlapX = Math.min(x + width, other.x + other.width) - Math.max(x, other.x);
    const overlapY = Math.min(y + height, other.y + other.height) - Math.max(y, other.y);
    if (overlapX <= 0 || overlapY <= 0) return false;
    const apartAlongX =
        Math.abs(x + width / 2 - other.x - other.width / 2) >= Math.abs(y + height / 2 - other.y - other.height / 2);
    return (apartAlongX ? overlapX : overlapY) > -spacing;
}

/** Boxes colliding with an earlier one at `spacing`, counted up to `limit`. */
export function countAxisLabelOverlaps(boxes: readonly BoxBounds[], spacing: number = 0, limit = Infinity): number {
    const result: BoxBounds[] = [];
    let count = 0;

    for (const box of boxes) {
        if (result.some((l) => labelBoxCollides(l, box, spacing))) {
            count++;
            if (count >= limit) break;
        }
        result.push(box);
    }

    return count;
}

/** True when any box collides with an earlier one at `spacing`. */
export function axisLabelsOverlap(boxes: readonly BoxBounds[], spacing: number = 0): boolean {
    return countAxisLabelOverlaps(boxes, spacing, 1) > 0;
}

export interface TickLabelCandidate<T> {
    readonly candidate: T;
    /** The ticks are fixed by configuration, so later candidates only vary the domain around them. */
    readonly pinned: boolean;
}

export interface TickLabelFit<T> {
    overlaps(candidate: T, rotationIndex: number): boolean;
    /** Characters truncation drops from the labels at this rotation. */
    droppedChars(candidate: T, rotationIndex: number): number;
    overlapCount(candidate: T, rotationIndex: number): number;
    /** The smallest step between shown labels that clears them, for ticks that cannot be thinned. */
    clearStride(candidate: T, rotationIndex: number): number;
}

/**
 * Per candidate, the first clear rotation that fits whole wins, else the clear one truncating least; with `truncates`,
 * fit index `rotationCount` (truncated at the last rotation) is tried before a sparser candidate.
 * If none clears, or labels are always shown, the fewest collisions win; pinned ticks keep the first pinned candidate
 * and show every `labelStride`th label, at the rotation needing the smallest stride.
 */
export function thinTickLabels<T>(
    next: () => TickLabelCandidate<T> | undefined,
    fit: TickLabelFit<T>,
    alwaysShow: boolean,
    rotationCount: number,
    truncates = false
): { candidate: T | undefined; rotationIndex: number; labelStride: number } {
    const fitCount = truncates ? rotationCount + 1 : rotationCount;
    let candidate: T | undefined;
    let firstPinned: T | undefined;

    for (let step = next(); step != null; step = next()) {
        candidate = step.candidate;
        const rotationIndex = clearRotation(candidate, fit, rotationCount);
        if (rotationIndex != null) return { candidate, rotationIndex, labelStride: 1 };
        if (truncates && !fit.overlaps(candidate, rotationCount)) {
            return { candidate, rotationIndex: rotationCount, labelStride: 1 };
        }
        if (alwaysShow) break;
        if (step.pinned) firstPinned ??= candidate;
    }

    if (firstPinned != null) return smallestStride(firstPinned, fit, fitCount);
    if (candidate == null) return { candidate, rotationIndex: 0, labelStride: 1 };
    return { candidate, rotationIndex: leastOverlappingRotation(candidate, fit, fitCount), labelStride: 1 };
}

function smallestStride<T>(candidate: T, fit: TickLabelFit<T>, fitCount: number) {
    let rotationIndex = 0;
    let labelStride = Infinity;
    for (let index = 0; index < fitCount; index++) {
        const stride = fit.clearStride(candidate, index);
        if (stride < labelStride) {
            rotationIndex = index;
            labelStride = stride;
        }
    }
    return { candidate, rotationIndex, labelStride };
}

function clearRotation<T>(candidate: T, fit: TickLabelFit<T>, rotationCount: number): number | undefined {
    let best: number | undefined;
    let bestDropped = Infinity;
    for (let rotationIndex = 0; rotationIndex < rotationCount; rotationIndex++) {
        if (fit.overlaps(candidate, rotationIndex)) continue;
        const dropped = fit.droppedChars(candidate, rotationIndex);
        if (dropped === 0) return rotationIndex;
        if (dropped < bestDropped) {
            best = rotationIndex;
            bestDropped = dropped;
        }
    }
    return best;
}

function leastOverlappingRotation<T>(candidate: T, fit: TickLabelFit<T>, rotationCount: number): number {
    if (rotationCount === 1) return 0;
    let best = 0;
    let bestCount = Infinity;
    for (let rotationIndex = 0; rotationIndex < rotationCount; rotationIndex++) {
        const count = fit.overlapCount(candidate, rotationIndex);
        if (count < bestCount) {
            best = rotationIndex;
            bestCount = count;
        }
    }
    return best;
}

export interface EdgeLabelOverflow {
    /** Leading edge of the first label, `undefined` when it cannot overflow the start. */
    readonly firstStart: number | undefined;
    /** Trailing edge of the last label, `undefined` when it has no label. */
    readonly lastEnd: number | undefined;
    readonly start: number;
    readonly end: number;
    /** Hide both end labels together, so neither end of the axis is left labelled alone. */
    readonly pairEnds: boolean;
}

/** Which end labels of a horizontal axis overflow the space they may run into. */
export function resolveEdgeLabelOverflow({ firstStart, lastEnd, start, end, pairEnds }: EdgeLabelOverflow): {
    hideFirst: boolean;
    hideLast: boolean;
} {
    let hideLast = lastEnd != null && lastEnd > end;
    let hideFirst = hideLast && pairEnds;

    if (!hideFirst && firstStart != null && firstStart < start) {
        hideFirst = true;
        hideLast ||= pairEnds;
    }

    return { hideFirst, hideLast };
}

export function labelExceedsBand(labelSize: number, bandSize: number): boolean {
    return labelSize > bandSize;
}

export interface RadialAxisLabel {
    readonly x: number;
    readonly y: number;
    hidden: boolean;
    box: BoxBounds | undefined;
}

function radialLabelsCollide(prev: RadialAxisLabel, next: RadialAxisLabel, threshold: number | undefined): boolean {
    if (prev.hidden || next.hidden) return false;

    const a = prev.box!;
    const b = next.box!;
    const grow = threshold == null ? 0 : threshold / 2;
    return boxCollides(
        { x: a.x - grow, y: a.y - grow, width: a.width + grow * 2, height: a.height + grow * 2 },
        b.x - grow,
        b.y - grow,
        b.width + grow * 2,
        b.height + grow * 2
    );
}

function hideRadialLabel(label: RadialAxisLabel) {
    label.hidden = true;
    label.box = undefined;
}

function coincident(a: RadialAxisLabel, b: RadialAxisLabel) {
    return isNumberEqual(a.x, b.x) && isNumberEqual(a.y, b.y);
}

/** Keeps the smallest step whose pairs, walked outward from the first label in both directions, are all clear. */
export function hideCollidingRadialCategoryLabels(labels: RadialAxisLabel[], threshold: number | undefined) {
    if (labels.length < 3) return;

    const collide = (prev: RadialAxisLabel, next: RadialAxisLabel) => radialLabelsCollide(prev, next, threshold);
    const firstLabel = labels[0];
    const visibleLabels = new Set<RadialAxisLabel>([firstLabel]);
    const walked = coincident(firstLabel, labels.at(-1)!) ? labels.slice(0, -1) : labels;
    const maxStep = Math.floor(labels.length / 2);
    for (let step = 1; step <= maxStep; step++) {
        if (!walkPairsOutward(walked, step, collide)) {
            walkPairsOutward(walked, step, (_, next) => {
                visibleLabels.add(next);
            });
            break;
        }
    }
    for (const label of labels) {
        if (!visibleLabels.has(label)) {
            hideRadialLabel(label);
        }
    }
}

/** Doubles the step from the first label until consecutive labels clear, else keeps only the first label. */
export function hideCollidingRadialNumberLabels(labels: RadialAxisLabel[], threshold: number | undefined) {
    const firstLabel = labels[0];
    const lastLabel = labels.at(-1)!;
    if (firstLabel !== lastLabel && coincident(firstLabel, lastLabel)) {
        lastLabel.hidden = true;
    }

    for (let step = 1; step < labels.length; step *= 2) {
        let collisionDetected = false;
        for (let i = step; i < labels.length; i += step) {
            if (radialLabelsCollide(labels[i - step], labels[i], threshold)) {
                collisionDetected = true;
                break;
            }
        }
        if (!collisionDetected) {
            for (const [i, label] of labels.entries()) {
                if (i % step > 0) hideRadialLabel(label);
            }
            return;
        }
    }

    for (const [i, label] of labels.entries()) {
        if (i > 0) hideRadialLabel(label);
    }
}

/**
 * Visit item pairs while walking away from index 0 in both directions around a circular list.
 * The visitor receives `(previous, current)` pairs and may stop early by returning `true`.
 *
 * Order:
 * - Forward: 0 -> step -> 2*step -> ... -> middle (inclusive)
 * - Backward: 0 -> lastStep -> lastStep-step -> ... -> just above the middle
 *
 * @param items Items to walk.
 * @param step Step size for each hop.
 * @param visitPair Visitor called with `(previous, current)` pairs.
 * @returns `true` if the visitor stopped the walk.
 */
export function walkPairsOutward<T>(
    items: T[],
    step: number,
    visitPair: (previous: T, current: T) => boolean | void
): boolean {
    const middleIndex = Math.floor(items.length / 2);
    return (
        walkPairsByStep(items, step, middleIndex, step, visitPair) ||
        walkPairsByStep(items, items.length - step, middleIndex, -step, visitPair)
    );
}

function walkPairsByStep<T>(
    items: T[],
    startIndex: number,
    endIndex: number,
    step: number,
    visitPair: (previous: T, current: T) => boolean | void
): boolean {
    let previous = items[0];
    for (let i = startIndex; step > 0 ? i <= endIndex : i > endIndex; i += step) {
        const current = items[i];
        if (visitPair(previous, current)) {
            return true;
        }
        previous = current;
    }
    return false;
}
