import type { Point } from '../../../scene/point';
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

function closeCmp(a: number, b: number, delta = 1e-6): -1 | 0 | 1 {
    if (a === b || 1 - Math.min(a, b) / Math.max(a, b) < delta) {
        return 0;
    } else if (a < b) {
        return -1;
    } else {
        return 1;
    }
}

function closeMatch<T extends number | string>(a: T, b: T, delta?: number) {
    if (a === b) {
        return true;
    }
    const an = Number(a);
    const bn = Number(b);
    return Number.isFinite(an) && Number.isFinite(bn) && closeCmp(an, bn, delta) === 0;
}

interface SpanTransform {
    unshifted: Span;
    shifted: Span;
}

function transformSpans(spanData: SpanDatum[], { x: xScale, y: yScale }: CartesianSeriesNodeDataContext['scales']) {
    let rangeSpanData: SpanDatum[] | undefined;
    const mergingInvalidSpans: SpanTransform[] = [];
    const interpolatingInvalidSpans: SpanTransform[] = [];

    let shiftedXStart = Infinity;
    let shiftedXEnd = -Infinity;

    for (const spanDatum of spanData) {
        const x0 = scale(spanDatum.xValue0, xScale);
        const y0 = scale(spanDatum.yValue0, yScale);
        const x1 = scale(spanDatum.xValue1, xScale);
        const y1 = scale(spanDatum.yValue1, yScale);
        const startIsFinite = Number.isFinite(x0);
        const endIsFinite = Number.isFinite(x1);

        if (startIsFinite && endIsFinite && rangeSpanData == null) {
            const unshifted = spanDatum.span;
            const shifted = rescaleSpan(unshifted, { x: x0, y: y0 }, { x: x1, y: y1 });
            const spanTransform: SpanTransform = { unshifted, shifted };
            shiftedXStart = Math.min(shiftedXStart, x0);
            shiftedXEnd = Math.max(shiftedXEnd, x1);
            mergingInvalidSpans.push(spanTransform);
            interpolatingInvalidSpans.push(spanTransform);
        } else if (startIsFinite && !endIsFinite && rangeSpanData == null) {
            rangeSpanData = [spanDatum];
        } else if (!startIsFinite && !endIsFinite && rangeSpanData != null) {
            if (rangeSpanData != null) {
                rangeSpanData.push(spanDatum);
            }
        } else if (!startIsFinite && endIsFinite && rangeSpanData != null) {
            rangeSpanData.push(spanDatum);

            const startSpanDatum = rangeSpanData.at(0)!;
            const endSpanDatum = rangeSpanData.at(-1)!;
            const start = spanRange(startSpanDatum.span)[0];
            const end = spanRange(endSpanDatum.span)[1];

            const unshifted: Span = {
                type: 'linear',
                moveTo: startSpanDatum.span.moveTo,
                x0: start.x,
                y0: start.y,
                x1: end.x,
                y1: end.y,
            };
            const transformStart: Point = {
                x: scale(startSpanDatum.xValue0, xScale),
                y: scale(startSpanDatum.yValue0, yScale),
            };
            const transformEnd: Point = {
                x: scale(endSpanDatum.xValue1, xScale),
                y: scale(endSpanDatum.yValue1, yScale),
            };
            const shifted = rescaleSpan(unshifted, transformStart, transformEnd);
            mergingInvalidSpans.push({ unshifted, shifted });

            const step = (end.x - start.x) / (rangeSpanData.length - 1);

            for (let i = 0; i < rangeSpanData.length; i += 1) {
                const { span: unshifted, yValue0, yValue1 } = rangeSpanData[i];

                const shifted = rescaleSpan(
                    unshifted,
                    { x: start.x + step * (i + 0), y: scale(yValue0, yScale) },
                    { x: start.x + step * (i + 1), y: scale(yValue1, yScale) }
                );
                interpolatingInvalidSpans.push({ unshifted, shifted });
            }

            shiftedXStart = Math.min(shiftedXStart, transformStart.x);
            shiftedXEnd = Math.max(shiftedXEnd, transformEnd.x);

            rangeSpanData = undefined;
        } else {
            // Invalid state
            rangeSpanData = undefined;
        }
    }

    const shiftedXRange = [shiftedXStart, shiftedXEnd];

    return { mergingInvalidSpans, interpolatingInvalidSpans, shiftedXRange };
}

export enum SplitMode {
    Zero,
    Divide,
}

export function pairUpSpans(newData: SpanContext, oldData: SpanContext, splitMode: SplitMode) {
    const oldSpans = transformSpans(oldData.data, newData.scales);
    const newSpans = transformSpans(newData.data, oldData.scales);

    const [oldRangeStartShifted, oldRangeEndShifted] = oldSpans.shiftedXRange;
    const [newRangeStartUnshifted, newRangeEndUnshifted] = newSpans.shiftedXRange;

    const removed: SpanInterpolation[] = [];
    const moved: SpanInterpolation[] = [];
    for (const oldSpanDatum of oldSpans.mergingInvalidSpans) {
        const oldSpanOldScale = oldSpanDatum.unshifted;
        const oldSpanNewScale = oldSpanDatum.shifted;
        const [{ x: fromStart, y: fromStartY }, { x: fromEnd, y: fromEndY }] = spanRange(oldSpanOldScale);

        let hasCorrespondingSpan = false;
        for (const newSpanDatum of newSpans.mergingInvalidSpans) {
            const newSpanOldScale = newSpanDatum.shifted;
            const newSpanNewScale = newSpanDatum.unshifted;

            const [{ x: toStartUnshifted }, { x: toEndUnshifted }] = spanRange(newSpanOldScale);

            if (closeCmp(fromStart, toEndUnshifted) !== -1 || closeCmp(fromEnd, toStartUnshifted) !== 1) {
                // No intersection
                continue;
            }

            if (closeMatch(fromStart, toStartUnshifted) && closeMatch(fromEnd, toEndUnshifted)) {
                // Exact overlap
                removed.push({ from: oldSpanOldScale, to: oldSpanOldScale });
                moved.push({ from: oldSpanOldScale, to: newSpanNewScale });
            } else if (fromStart <= toStartUnshifted && fromEnd >= toEndUnshifted) {
                removed.push({ from: oldSpanOldScale, to: oldSpanOldScale });
                moved.push({ from: oldSpanOldScale, to: oldSpanNewScale });
            } else {
                // Overlap on left or right
                const xRangeStart = Math.max(fromStart, toStartUnshifted);
                const xRangeEnd = Math.min(fromEnd, toEndUnshifted);
                const clippedOldSpanOldScale = clipSpanX(oldSpanOldScale, xRangeStart, xRangeEnd);
                const clippedNewSpanOldScale = clipSpanX(newSpanOldScale, xRangeStart, xRangeEnd);
                const clippedNewSpanNewScale = clipSpanX(newSpanNewScale, xRangeStart, xRangeEnd);
                removed.push({ from: clippedOldSpanOldScale, to: clippedNewSpanOldScale });
                moved.push({ from: clippedNewSpanOldScale, to: clippedNewSpanNewScale });
            }

            hasCorrespondingSpan = true;
        }

        if (hasCorrespondingSpan) continue;

        if (closeCmp(fromEnd, newRangeStartUnshifted) !== 1) {
            removed.push({
                from: oldSpanOldScale,
                to: rescaleSpan(
                    oldSpanOldScale,
                    { x: newRangeStartUnshifted, y: fromStartY },
                    { x: newRangeStartUnshifted, y: fromEndY }
                ),
            });
        } else if (closeCmp(fromStart, newRangeEndUnshifted) !== -1) {
            removed.push({
                from: oldSpanOldScale,
                to: rescaleSpan(
                    oldSpanOldScale,
                    { x: newRangeEndUnshifted, y: fromStartY },
                    { x: newRangeEndUnshifted, y: fromEndY }
                ),
            });
        } else if (splitMode === SplitMode.Zero) {
            const y = scale(0, oldData.scales.y);
            removed.push({
                from: oldSpanOldScale,
                to: rescaleSpan(oldSpanOldScale, { x: fromStart, y }, { x: fromEnd, y }),
            });
        } else if (splitMode === SplitMode.Divide) {
            const [left, right] = splitSpanAtX(oldSpanOldScale, (fromStart + fromEnd) / 2);
            removed.push(
                { from: left, to: collapseSpanToPoint(left, { x: fromStart, y: fromStartY }) },
                { from: right, to: collapseSpanToPoint(right, { x: fromEnd, y: fromEndY }) }
            );
        }
    }

    const added: SpanInterpolation[] = [];
    for (const newSpanDatum of newSpans.interpolatingInvalidSpans) {
        const newSpanNewScale = newSpanDatum.unshifted;
        const [{ x: toStart, y: toStartY }, { x: toEnd, y: toEndY }] = spanRange(newSpanNewScale);

        let hasCorrespondingSpan = false;
        for (const oldSpanDatum of oldSpans.interpolatingInvalidSpans) {
            const oldSpanNewScale = oldSpanDatum.shifted;
            const [{ x: fromStartShifted }, { x: fromEndShifted }] = spanRange(oldSpanNewScale);

            if (closeCmp(fromStartShifted, toEnd) !== -1 || closeCmp(fromEndShifted, toStart) !== 1) {
                // No intersection
                continue;
            }

            if (closeMatch(fromStartShifted, toStart) && closeMatch(fromEndShifted, toEnd)) {
                // Exact overlap (handled in move phase)
                added.push({ from: newSpanNewScale, to: newSpanNewScale });
            } else if (fromStartShifted <= toStart && fromEndShifted >= toEnd) {
                // Complete overlap
                const clippedOldSpanNewScale = clipSpanX(oldSpanNewScale, toStart, toEnd);
                added.push({ from: clippedOldSpanNewScale, to: newSpanNewScale });
            } else {
                // Any overlap (handled in removed phase)
                added.push({ from: newSpanNewScale, to: newSpanNewScale });
            }

            hasCorrespondingSpan = true;
        }

        if (hasCorrespondingSpan) continue;

        if (closeCmp(toEnd, oldRangeStartShifted) !== 1) {
            added.push({
                from: rescaleSpan(
                    newSpanNewScale,
                    { x: oldRangeStartShifted, y: toStartY },
                    { x: oldRangeStartShifted, y: toEndY }
                ),
                to: newSpanNewScale,
            });
        } else if (closeCmp(toStart, oldRangeEndShifted) !== -1) {
            added.push({
                from: rescaleSpan(
                    newSpanNewScale,
                    { x: oldRangeEndShifted, y: toStartY },
                    { x: oldRangeEndShifted, y: toEndY }
                ),
                to: newSpanNewScale,
            });
        } else if (splitMode === SplitMode.Zero) {
            const y = scale(0, newData.scales.y);
            added.push({ from: rescaleSpan(newSpanNewScale, { x: toStart, y }, { x: toEnd, y }), to: newSpanNewScale });
        } else if (splitMode === SplitMode.Divide) {
            const [left, right] = splitSpanAtX(newSpanNewScale, (toStart + toEnd) / 2);
            added.push(
                { from: collapseSpanToPoint(left, { x: toStart, y: toStartY }), to: newSpanNewScale },
                { from: collapseSpanToPoint(right, { x: toEnd, y: toEndY }), to: newSpanNewScale }
            );
        }
    }

    return { added, moved, removed };
}
