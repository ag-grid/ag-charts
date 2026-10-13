import { isNumberEqual } from '../data/numbers';
import { type BoxBounds, boxCollides } from './boxBounds';

const DEFAULT_TICK_LABEL_SPACING = 10;

/** Gap kept between cartesian tick labels: rotated labels pack edge to edge unless `minSpacing` says otherwise. */
export function tickLabelSpacing(minSpacing: number | undefined, rotated: boolean): number {
    return minSpacing ?? (rotated ? 0 : DEFAULT_TICK_LABEL_SPACING);
}

/** True when any box collides with an earlier one after growing its width and height by `spacing`. */
export function axisLabelsOverlap(boxes: readonly BoxBounds[], spacing: number = 0): boolean {
    const result: BoxBounds[] = [];

    for (const box of boxes) {
        const { x, y, width, height } = box;
        if (result.some((l) => boxCollides(l, x, y, width + spacing, height + spacing))) {
            return true;
        }
        result.push(box);
    }

    return false;
}

export interface TickLabelCandidate<T> {
    readonly candidate: T;
    /** The ticks are fixed by configuration, so a sparser candidate would not thin their labels. */
    readonly pinned: boolean;
}

/**
 * Thins tick labels by walking ever sparser, evenly spaced candidates until one has no overlapping labels,
 * auto-rotating any candidate whose labels overlap unrotated. `next` returns `undefined` once exhausted.
 */
export function thinTickLabels<T>(
    next: () => TickLabelCandidate<T> | undefined,
    overlaps: (candidate: T, autoRotation: number) => boolean,
    avoidCollisions: boolean,
    autoRotateAngle: number | undefined
): { candidate: T | undefined; autoRotation: number } {
    let candidate: T | undefined;
    let autoRotation = 0;
    let overlap = true;

    while (overlap) {
        const step = next();
        if (step == null) break;
        candidate = step.candidate;

        autoRotation = autoRotateAngle != null && overlaps(candidate, 0) ? autoRotateAngle : 0;

        if (step.pinned) break;

        overlap = avoidCollisions && overlaps(candidate, autoRotation);
    }

    return { candidate, autoRotation };
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

function radialLabelsCollide(prev: RadialAxisLabel, next: RadialAxisLabel, minSpacing: number | undefined): boolean {
    if (prev.hidden || next.hidden) return false;

    const a = prev.box!;
    const b = next.box!;
    const grow = minSpacing == null ? 0 : minSpacing / 2;
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
export function hideCollidingRadialCategoryLabels(labels: RadialAxisLabel[], minSpacing: number | undefined) {
    if (labels.length < 3) return;

    const collide = (prev: RadialAxisLabel, next: RadialAxisLabel) => radialLabelsCollide(prev, next, minSpacing);
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
export function hideCollidingRadialNumberLabels(labels: RadialAxisLabel[], minSpacing: number | undefined) {
    const firstLabel = labels[0];
    const lastLabel = labels.at(-1)!;
    if (firstLabel !== lastLabel && coincident(firstLabel, lastLabel)) {
        lastLabel.hidden = true;
    }

    for (let step = 1; step < labels.length; step *= 2) {
        let collisionDetected = false;
        for (let i = step; i < labels.length; i += step) {
            if (radialLabelsCollide(labels[i - step], labels[i], minSpacing)) {
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
