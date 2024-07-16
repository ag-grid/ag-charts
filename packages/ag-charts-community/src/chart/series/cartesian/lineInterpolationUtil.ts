import type { CartesianSeriesNodeDataContext } from './cartesianSeries';
import { type Span, clipSpanX, collapseSpanToPoint, rescaleSpan, spanRange, splitSpanAtX } from './lineInterpolation';
import { scale } from './lineUtil';

export interface SpanDatum {
    span: Span;
    xValue0: any;
    yValue0: any;
    xValue1: any;
    yValue1: any;
}

export interface SpanContext {
    scales: CartesianSeriesNodeDataContext['scales'];
    data: SpanDatum[];
    visible: boolean;
}

export interface SpanInterpolation {
    from: Span;
    to: Span;
}

function closeCmp(a: number, b: number, delta = 0.01): -1 | 0 | 1 {
    if (a === b || 1 - Math.min(a, b) / Math.max(a, b) < delta) {
        return 0;
    } else if (a < b) {
        return -1;
    } else {
        return 1;
    }
}

function closeMatch<T extends number | string>(a: T, b: T, delta = 0.01) {
    if (a === b) {
        return true;
    }
    const an = Number(a);
    const bn = Number(b);
    return Number.isFinite(an) && Number.isFinite(bn) && closeCmp(an, bn, delta) === 0;
}

function spanXDataRange(spanData: Array<SpanDatum | null>, xScale: CartesianSeriesNodeDataContext['scales']['x']) {
    let rangeXStart = Infinity;
    let rangeXEnd = -Infinity;
    for (const spanDatum of spanData) {
        if (spanDatum != null) {
            const startXShifted = scale(spanDatum.xValue0, xScale);
            const endXShifted = scale(spanDatum.xValue1, xScale);

            rangeXStart = Math.min(rangeXStart, startXShifted);
            rangeXEnd = Math.max(rangeXEnd, endXShifted);
        }
    }
    return [rangeXStart, rangeXEnd];
}

export enum SplitMode {
    Zero,
    Divide,
}

export function pairUpSpans(newData: SpanContext, oldData: SpanContext, splitMode: SplitMode) {
    const oldScaleX = oldData.scales.x;
    const oldScaleY = oldData.scales.y;
    const oldSpanData = oldData.data;
    const newScaleX = newData.scales.x;
    const newScaleY = newData.scales.y;
    const newSpanData = newData.data;

    const [oldRangeStartShifted, oldRangeEndShifted] = spanXDataRange(oldSpanData, newScaleX);
    const [newRangeStartUnshifted, newRangeEndUnshifted] = spanXDataRange(newSpanData, oldScaleX);

    const removed: SpanInterpolation[] = [];
    const moved: SpanInterpolation[] = [];
    for (const oldSpanDatum of oldSpanData) {
        const oldSpan = oldSpanDatum.span;
        const [{ x: fromStart, y: fromStartY }, { x: fromEnd, y: fromEndY }] = spanRange(oldSpan);

        let hasCorrespondingSpan = false;
        for (const newSpanDatum of newSpanData) {
            if (newSpanDatum == null) continue;

            const newSpan = newSpanDatum.span;
            const toStartUnshifted = scale(newSpanDatum.xValue0, oldScaleX);
            const toEndUnshifted = scale(newSpanDatum.xValue1, oldScaleX);

            if (closeCmp(fromStart, toEndUnshifted) !== -1 || closeCmp(fromEnd, toStartUnshifted) !== 1) {
                // No intersection
                continue;
            }

            if (closeMatch(fromStart, toStartUnshifted) && closeMatch(fromEnd, toEndUnshifted)) {
                // Exact overlap
                removed.push({ from: oldSpan, to: oldSpan });
                moved.push({ from: oldSpan, to: newSpan });
            } else if (fromStart <= toStartUnshifted && fromEnd >= toEndUnshifted) {
                const oldSpanInNewScale = rescaleSpan(
                    oldSpan,
                    { x: fromStart, y: scale(oldSpanDatum.yValue0, newScaleY) },
                    { x: fromEnd, y: scale(oldSpanDatum.yValue1, newScaleY) }
                );
                removed.push({ from: oldSpan, to: oldSpan });
                moved.push({ from: oldSpan, to: oldSpanInNewScale });
            } else {
                // Overlap on left or right
                const xRangeStart = Math.max(fromStart, toStartUnshifted);
                const xRangeEnd = Math.min(fromEnd, toEndUnshifted);
                const newSpanInOldScale = rescaleSpan(
                    newSpan,
                    { x: fromStart, y: scale(newSpanDatum.yValue0, oldScaleY) },
                    { x: fromEnd, y: scale(newSpanDatum.yValue1, oldScaleY) }
                );
                const clippedOldSpan = clipSpanX(oldSpan, xRangeStart, xRangeEnd);
                const clippedNewSpanInOldScale = clipSpanX(newSpanInOldScale, xRangeStart, xRangeEnd);
                const clippedNewSpan = clipSpanX(newSpan, xRangeStart, xRangeEnd);
                removed.push({ from: clippedOldSpan, to: clippedNewSpanInOldScale });
                moved.push({ from: clippedNewSpanInOldScale, to: clippedNewSpan });
            }

            hasCorrespondingSpan = true;
        }

        if (hasCorrespondingSpan) continue;

        if (closeCmp(fromEnd, newRangeStartUnshifted) !== 1) {
            removed.push({
                from: oldSpan,
                to: rescaleSpan(
                    oldSpan,
                    { x: newRangeStartUnshifted, y: fromStartY },
                    { x: newRangeStartUnshifted, y: fromEndY }
                ),
            });
        } else if (closeCmp(fromStart, newRangeEndUnshifted) !== -1) {
            removed.push({
                from: oldSpan,
                to: rescaleSpan(
                    oldSpan,
                    { x: newRangeEndUnshifted, y: fromStartY },
                    { x: newRangeEndUnshifted, y: fromEndY }
                ),
            });
        } else if (splitMode === SplitMode.Zero) {
            const y = scale(0, oldData.scales.y);
            removed.push({ from: oldSpan, to: rescaleSpan(oldSpan, { x: fromStart, y }, { x: fromEnd, y }) });
        } else if (splitMode === SplitMode.Divide) {
            const [left, right] = splitSpanAtX(oldSpan, (fromStart + fromEnd) / 2);
            removed.push(
                { from: left, to: collapseSpanToPoint(left, { x: fromStart, y: fromStartY }) },
                { from: right, to: collapseSpanToPoint(right, { x: fromEnd, y: fromEndY }) }
            );
        }
    }

    const added: SpanInterpolation[] = [];
    for (const newSpanDatum of newSpanData) {
        const newSpan = newSpanDatum.span;
        const [{ x: toStart, y: toStartY }, { x: toEnd, y: toEndY }] = spanRange(newSpan);

        let hasCorrespondingSpan = false;
        for (const oldSpanDatum of oldSpanData) {
            if (oldSpanDatum == null) continue;

            const oldSpan = oldSpanDatum.span;
            const fromStartShifted = scale(oldSpanDatum.xValue0, newScaleX);
            const fromEndShifted = scale(oldSpanDatum.xValue1, newScaleX);

            if (closeCmp(fromStartShifted, toEnd) !== -1 || closeCmp(fromEndShifted, toStart) !== 1) {
                // No intersection
                continue;
            }

            if (closeMatch(fromStartShifted, toStart) && closeMatch(fromEndShifted, toEnd)) {
                // Exact overlap (handled in move phase)
                added.push({ from: newSpan, to: newSpan });
            } else if (fromStartShifted <= toStart && fromEndShifted >= toEnd) {
                // Complete overlap
                const oldSpanInNewScale = rescaleSpan(
                    oldSpan,
                    { x: fromStartShifted, y: scale(oldSpanDatum.yValue0, newScaleY) },
                    { x: fromEndShifted, y: scale(oldSpanDatum.yValue1, newScaleY) }
                );
                const clippedOldSpanInNewScale = clipSpanX(oldSpanInNewScale, toStart, toEnd);
                added.push({ from: clippedOldSpanInNewScale, to: newSpan });
            } else {
                // Any overlap (handled in removed phase)
                added.push({ from: newSpan, to: newSpan });
            }

            hasCorrespondingSpan = true;
        }

        if (hasCorrespondingSpan) continue;

        if (closeCmp(toEnd, oldRangeStartShifted) !== 1) {
            added.push({
                from: rescaleSpan(
                    newSpan,
                    { x: oldRangeStartShifted, y: toStartY },
                    { x: oldRangeStartShifted, y: toEndY }
                ),
                to: newSpan,
            });
        } else if (closeCmp(toStart, oldRangeEndShifted) !== -1) {
            added.push({
                from: rescaleSpan(
                    newSpan,
                    { x: oldRangeEndShifted, y: toStartY },
                    { x: oldRangeEndShifted, y: toEndY }
                ),
                to: newSpan,
            });
        } else if (splitMode === SplitMode.Zero) {
            const y = scale(0, newData.scales.y);
            added.push({ from: rescaleSpan(newSpan, { x: toStart, y }, { x: toEnd, y }), to: newSpan });
        } else if (splitMode === SplitMode.Divide) {
            const [left, right] = splitSpanAtX(newSpan, (toStart + toEnd) / 2);
            added.push(
                { from: collapseSpanToPoint(left, { x: toStart, y: toStartY }), to: newSpan },
                { from: collapseSpanToPoint(right, { x: toEnd, y: toEndY }), to: newSpan }
            );
        }
    }

    return { added, moved, removed };
}
