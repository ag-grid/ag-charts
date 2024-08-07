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

            const transformStart: Point = {
                x: scale(startSpanDatum.xValue0, xScale),
                y: scale(startSpanDatum.yValue0, yScale),
            };
            const transformEnd: Point = {
                x: scale(endSpanDatum.xValue1, xScale),
                y: scale(endSpanDatum.yValue1, yScale),
            };

            const step = (transformEnd.x - transformStart.x) / (rangeSpanData.length - 1);

            for (let i = 0; i < rangeSpanData.length; i += 1) {
                const { span: interpolatingUnshifted, yValue0, yValue1 } = rangeSpanData[i];

                const interpolatingShifted = rescaleSpan(
                    interpolatingUnshifted,
                    { x: transformStart.x + step * (i + 0), y: scale(yValue0, yScale) },
                    { x: transformStart.x + step * (i + 1), y: scale(yValue1, yScale) }
                );
                interpolatingInvalidSpans.push({ unshifted: interpolatingUnshifted, shifted: interpolatingShifted });
            }

            shiftedXStart = Math.min(shiftedXStart, transformStart.x);
            shiftedXEnd = Math.max(shiftedXEnd, transformEnd.x);

            rangeSpanData = undefined;
        } else if (!startIsFinite && endIsFinite && rangeSpanData == null) {
            // Removed category at start
            const unshifted = spanDatum.span;
            const shifted = rescaleSpan(unshifted, { x: x1, y: y0 }, { x: x1, y: y1 });
            interpolatingInvalidSpans.push({ unshifted, shifted });
        } else {
            // Invalid state
            rangeSpanData = undefined;
        }
    }

    // Removed category at end
    if (rangeSpanData != null) {
        const startSpanDatum = rangeSpanData.at(0)!;
        const x = scale(startSpanDatum.xValue0, xScale);

        for (const { span: interpolatingUnshifted, yValue0, yValue1 } of rangeSpanData) {
            const interpolatingShifted = rescaleSpan(
                interpolatingUnshifted,
                { x, y: scale(yValue0, yScale) },
                { x, y: scale(yValue1, yScale) }
            );
            interpolatingInvalidSpans.push({ unshifted: interpolatingUnshifted, shifted: interpolatingShifted });
        }
    }

    const shiftedXRange = [shiftedXStart, shiftedXEnd];

    return { interpolatingInvalidSpans, shiftedXRange };
}

export enum SplitMode {
    Zero,
    Divide,
}

export function pairUpSpans(newData: SpanContext, oldData: SpanContext, splitMode: SplitMode) {
    const oldSpans = transformSpans(oldData.data, newData.scales);
    const newSpans = transformSpans(newData.data, oldData.scales);

    const [oldRangeStartNewScale, oldRangeEndNewScale] = oldSpans.shiftedXRange;
    const [newRangeStartOldScale, newRangeEndOldScale] = newSpans.shiftedXRange;

    const removed: SpanInterpolation[] = [];
    const moved: SpanInterpolation[] = [];
    for (const oldSpanDatum of oldSpans.interpolatingInvalidSpans) {
        const oldSpanOldScale = oldSpanDatum.unshifted;
        const oldSpanNewScale = oldSpanDatum.shifted;
        const [{ x: fromStartOldScale, y: fromStartOldScaleY }, { x: fromEndOldScale, y: fromEndOldScaleY }] =
            spanRange(oldSpanOldScale);

        let hasCorrespondingSpan = false;
        for (const newSpanDatum of newSpans.interpolatingInvalidSpans) {
            const newSpanOldScale = newSpanDatum.shifted;
            const newSpanNewScale = newSpanDatum.unshifted;

            const [{ x: toStartOldScale }, { x: toEndOldScale }] = spanRange(newSpanOldScale);

            if (closeCmp(fromStartOldScale, toEndOldScale) !== -1 || closeCmp(fromEndOldScale, toStartOldScale) !== 1) {
                // No intersection
                continue;
            }

            if (closeMatch(fromStartOldScale, toStartOldScale) && closeMatch(fromEndOldScale, toEndOldScale)) {
                // Exact overlap
                removed.push({ from: oldSpanOldScale, to: oldSpanOldScale });
                moved.push({ from: oldSpanOldScale, to: newSpanNewScale });
            } else if (fromStartOldScale <= toStartOldScale && fromEndOldScale >= toEndOldScale) {
                removed.push({ from: oldSpanOldScale, to: oldSpanOldScale });
                moved.push({ from: oldSpanOldScale, to: oldSpanNewScale });
            } else {
                // Overlap on left or right
                const [{ x: fromStartNewScale }, { x: fromEndNewScale }] = spanRange(oldSpanNewScale);
                const [{ x: toStartNewScale }, { x: toEndNewScale }] = spanRange(newSpanNewScale);

                const xRangeStartOldScale = Math.max(fromStartOldScale, toStartOldScale);
                const xRangeEndOldScale = Math.min(fromEndOldScale, toEndOldScale);
                const clippedOldSpanOldScale = clipSpanX(oldSpanOldScale, xRangeStartOldScale, xRangeEndOldScale);
                const clippedNewSpanOldScale = clipSpanX(newSpanOldScale, xRangeStartOldScale, xRangeEndOldScale);

                const xRangeStartNewScale = Math.max(fromStartNewScale, toStartNewScale);
                const xRangeEndNewScale = Math.min(fromEndNewScale, toEndNewScale);
                const clippedNewSpanNewScale = clipSpanX(newSpanNewScale, xRangeStartNewScale, xRangeEndNewScale);

                removed.push({ from: clippedOldSpanOldScale, to: clippedNewSpanOldScale });
                moved.push({ from: clippedNewSpanOldScale, to: clippedNewSpanNewScale });
            }

            hasCorrespondingSpan = true;
        }

        if (hasCorrespondingSpan) continue;

        if (closeCmp(fromEndOldScale, newRangeStartOldScale) !== 1) {
            removed.push({
                from: oldSpanOldScale,
                to: rescaleSpan(
                    oldSpanOldScale,
                    { x: newRangeStartOldScale, y: fromStartOldScaleY },
                    { x: newRangeStartOldScale, y: fromEndOldScaleY }
                ),
            });
        } else if (closeCmp(fromStartOldScale, newRangeEndOldScale) !== -1) {
            removed.push({
                from: oldSpanOldScale,
                to: rescaleSpan(
                    oldSpanOldScale,
                    { x: newRangeEndOldScale, y: fromStartOldScaleY },
                    { x: newRangeEndOldScale, y: fromEndOldScaleY }
                ),
            });
        } else if (splitMode === SplitMode.Zero) {
            const y = scale(0, oldData.scales.y);
            removed.push({
                from: oldSpanOldScale,
                to: rescaleSpan(oldSpanOldScale, { x: fromStartOldScale, y }, { x: fromEndOldScale, y }),
            });
        } else if (splitMode === SplitMode.Divide) {
            const [left, right] = splitSpanAtX(oldSpanOldScale, (fromStartOldScale + fromEndOldScale) / 2);
            removed.push(
                { from: left, to: collapseSpanToPoint(left, { x: fromStartOldScale, y: fromStartOldScaleY }) },
                { from: right, to: collapseSpanToPoint(right, { x: fromEndOldScale, y: fromEndOldScaleY }) }
            );
        }
    }

    const added: SpanInterpolation[] = [];
    for (const newSpanDatum of newData.data) {
        const newSpanNewScale = newSpanDatum.span;
        const [{ x: toStartNewScale, y: toStartNewScaleY }, { x: toEndNewScale, y: toEndNewScaleY }] =
            spanRange(newSpanNewScale);

        let hasCorrespondingSpan = false;
        for (const oldSpanDatum of oldSpans.interpolatingInvalidSpans) {
            const oldSpanNewScale = oldSpanDatum.shifted;
            const [{ x: fromStartNewScale }, { x: fromEndNewScale }] = spanRange(oldSpanNewScale);

            if (closeCmp(fromStartNewScale, toEndNewScale) !== -1 || closeCmp(fromEndNewScale, toStartNewScale) !== 1) {
                // No intersection
                continue;
            }

            if (closeMatch(fromStartNewScale, toStartNewScale) && closeMatch(fromEndNewScale, toEndNewScale)) {
                // Exact overlap (handled in move phase)
                added.push({ from: newSpanNewScale, to: newSpanNewScale });
            } else if (fromStartNewScale <= toStartNewScale && fromEndNewScale >= toEndNewScale) {
                // Complete overlap
                const clippedOldSpanNewScale = clipSpanX(oldSpanNewScale, toStartNewScale, toEndNewScale);
                added.push({ from: clippedOldSpanNewScale, to: newSpanNewScale });
            } else {
                // Any overlap (handled in removed phase)
                added.push({ from: newSpanNewScale, to: newSpanNewScale });
            }

            hasCorrespondingSpan = true;
        }

        if (hasCorrespondingSpan) continue;

        if (closeCmp(toEndNewScale, oldRangeStartNewScale) !== 1) {
            added.push({
                from: rescaleSpan(
                    newSpanNewScale,
                    { x: oldRangeStartNewScale, y: toStartNewScaleY },
                    { x: oldRangeStartNewScale, y: toEndNewScaleY }
                ),
                to: newSpanNewScale,
            });
        } else if (closeCmp(toStartNewScale, oldRangeEndNewScale) !== -1) {
            added.push({
                from: rescaleSpan(
                    newSpanNewScale,
                    { x: oldRangeEndNewScale, y: toStartNewScaleY },
                    { x: oldRangeEndNewScale, y: toEndNewScaleY }
                ),
                to: newSpanNewScale,
            });
        } else if (splitMode === SplitMode.Zero) {
            const y = scale(0, newData.scales.y);
            added.push({
                from: rescaleSpan(newSpanNewScale, { x: toStartNewScale, y }, { x: toEndNewScale, y }),
                to: newSpanNewScale,
            });
        } else if (splitMode === SplitMode.Divide) {
            const [left, right] = splitSpanAtX(newSpanNewScale, (toStartNewScale + toEndNewScale) / 2);
            added.push(
                { from: collapseSpanToPoint(left, { x: toStartNewScale, y: toStartNewScaleY }), to: newSpanNewScale },
                { from: collapseSpanToPoint(right, { x: toEndNewScale, y: toEndNewScaleY }), to: newSpanNewScale }
            );
        }
    }

    return { added, moved, removed };
}
