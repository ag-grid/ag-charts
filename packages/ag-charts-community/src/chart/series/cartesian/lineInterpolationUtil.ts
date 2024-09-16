import { transformIntegratedCategoryValue } from '../../../util/value';
import type { CartesianSeriesNodeDataContext } from './cartesianSeries';
import { type Span, clipSpanX, rescaleSpan, spanRange } from './lineInterpolation';
import { scale } from './lineUtil';

type AxisValue = string | number;

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
    zeroData?: SpanDatum[];
}

interface AxisContext {
    axisValues: any[];
    oldDataAxisIndices: SpanIndices[];
    newDataAxisIndices: SpanIndices[];
}

export interface SpanInterpolation {
    from: Span;
    to: Span;
}

export interface SpanInterpolationResult {
    removed: SpanInterpolation[];
    moved: SpanInterpolation[];
    added: SpanInterpolation[];
}

interface SpanIndices {
    xValue0Index: number;
    xValue1Index: number;
    datumIndex: number;
}

function axisValue(value: any) {
    return transformIntegratedCategoryValue(value).valueOf();
}

function getAxisIndices({ data }: SpanContext, axisValues: any[]): SpanIndices[] {
    return data.map((datum, datumIndex) => ({
        xValue0Index: axisValues.indexOf(axisValue(datum.xValue0)),
        xValue1Index: axisValues.indexOf(axisValue(datum.xValue1)),
        datumIndex,
    }));
}

function validateAxisValuesOrder(axisValues: any[], data: SpanContext) {
    let x0 = -Infinity;
    for (const axisValue of axisValues) {
        const x = scale(axisValue, data.scales.x);
        if (!Number.isFinite(x)) {
            continue;
        } else if (x < x0) {
            // Unsorted
            return false;
        } else {
            x0 = x;
        }
    }

    return true;
}

function getAxisValues(newData: SpanContext, oldData: SpanContext): AxisContext | undefined {
    // Old and new axis values might not be directly comparable
    // Array.sort does not handle this case
    const allAxisValues = new Set<AxisValue>();
    for (const { xValue0, xValue1 } of newData.data) {
        const xValue0Value = axisValue(xValue0);
        const xValue1Value = axisValue(xValue1);
        allAxisValues.add(xValue0Value).add(xValue1Value);
    }

    const newAxisValues = Array.from(allAxisValues).sort((a, b) => {
        return scale(a, newData.scales.x) - scale(b, newData.scales.x);
    });

    const exclusivelyOldAxisValues = [];
    for (const { xValue0, xValue1 } of oldData.data) {
        const xValue0Value = axisValue(xValue0);
        const xValue1Value = axisValue(xValue1);
        if (!allAxisValues.has(xValue0Value)) {
            allAxisValues.add(xValue0Value);
            exclusivelyOldAxisValues.push(xValue0Value);
        }
        if (!allAxisValues.has(xValue1Value)) {
            allAxisValues.add(xValue1Value);
            exclusivelyOldAxisValues.push(xValue1Value);
        }
    }

    exclusivelyOldAxisValues.sort((a, b) => {
        return scale(a, oldData.scales.x) - scale(b, oldData.scales.x);
    });

    const axisValues = newAxisValues;
    let insertionIndex = 0;
    for (const oldValue of exclusivelyOldAxisValues) {
        inner: for (let i = axisValues.length; i > insertionIndex; i -= 1) {
            const oldValueX = scale(oldValue, oldData.scales.x);
            const newValueX = scale(axisValues[i], oldData.scales.x);
            if (oldValueX > newValueX) {
                insertionIndex = i + 1;
                break inner;
            }
        }

        axisValues.splice(insertionIndex, 0, oldValue);
        insertionIndex += 1;
    }

    if (!validateAxisValuesOrder(axisValues, oldData)) return;

    const oldDataAxisIndices = getAxisIndices(oldData, axisValues);
    const newDataAxisIndices = getAxisIndices(newData, axisValues);

    return { axisValues, oldDataAxisIndices, newDataAxisIndices };
}

function clipSpan(span: Span, xValue0Index: number, xIndices: SpanIndices): Span {
    if (xIndices.xValue1Index === xIndices.xValue0Index + 1) return span;

    const range = spanRange(span);
    const step = (range[1].x - range[0].x) / (xIndices.xValue1Index - xIndices.xValue0Index);
    const start = range[0].x + (xValue0Index - xIndices.xValue0Index) * step;
    const end = start + step;
    return clipSpanX(span, start, end);
}

function axisZeroSpan(span: Span, data: SpanContext) {
    const [r0, r1] = spanRange(span);
    const y0 = scale(0, data.scales.y);
    return rescaleSpan(span, { x: r0.x, y: y0 }, { x: r1.x, y: y0 });
}

function collapseSpan(
    span: Span,
    data: SpanContext,
    axisIndices: SpanIndices[],
    indices: SpanIndices,
    range: Pick<SpanIndices, 'xValue0Index' | 'xValue1Index'>
) {
    let xValue: any;
    let yValue: any;

    if (indices.xValue0Index >= range.xValue1Index) {
        const datumIndex = axisIndices.findLast((i) => i.xValue1Index <= range.xValue1Index)?.datumIndex;
        const datum = datumIndex != null ? data.data[datumIndex] : undefined;
        xValue = datum?.xValue1;
        yValue = datum?.yValue1;
    } else if (indices.xValue0Index <= range.xValue0Index) {
        const datumIndex = axisIndices.find((i) => i.xValue0Index >= range.xValue0Index)?.datumIndex;
        const datum = datumIndex != null ? data.data[datumIndex] : undefined;
        xValue = datum?.xValue0;
        yValue = datum?.yValue0;
    }

    if (xValue == null || yValue == null) {
        return axisZeroSpan(span, data);
    }

    const x = scale(xValue, data.scales.x);
    const y = scale(yValue, data.scales.y);
    const point = { x, y };

    return rescaleSpan(span, point, point);
}

function zeroDataSpan(spanDatum: SpanDatum, zeroData: SpanDatum[] | undefined) {
    const newSpanXValue0 = axisValue(spanDatum.xValue0);
    const newSpanXValue1 = axisValue(spanDatum.xValue1);
    const zeroSpan = zeroData?.find(
        (span) => axisValue(span.xValue0) === newSpanXValue0 && axisValue(span.xValue1) === newSpanXValue1
    )?.span;

    return zeroSpan;
}

function addSpan(
    newData: SpanContext,
    newAxisIndices: SpanIndices[],
    newIndices: SpanIndices,
    oldZeroData: SpanDatum[] | undefined,
    range: Pick<SpanIndices, 'xValue0Index' | 'xValue1Index'>,
    out: SpanInterpolationResult
) {
    const newSpanDatum = newData.data[newIndices.datumIndex];
    const newSpan = newSpanDatum.span;
    const zeroSpan = zeroDataSpan(newSpanDatum, oldZeroData);

    if (zeroSpan != null) {
        out.removed.push({ from: zeroSpan, to: zeroSpan });
        out.moved.push({ from: zeroSpan, to: newSpan });
        out.added.push({ from: newSpan, to: newSpan });
    } else {
        const oldSpan = collapseSpan(newSpan, newData, newAxisIndices, newIndices, range);
        out.added.push({ from: oldSpan, to: newSpan });
    }
}

function removeSpan(
    oldData: SpanContext,
    oldAxisIndices: SpanIndices[],
    oldIndices: SpanIndices,
    newZeroData: SpanDatum[] | undefined,
    range: Pick<SpanIndices, 'xValue0Index' | 'xValue1Index'>,
    out: SpanInterpolationResult
) {
    const oldSpanDatum = oldData.data[oldIndices.datumIndex];
    const oldSpan = oldSpanDatum.span;
    const zeroSpan = zeroDataSpan(oldSpanDatum, newZeroData);

    if (zeroSpan != null) {
        out.removed.push({ from: oldSpan, to: oldSpan });
        out.moved.push({ from: oldSpan, to: zeroSpan });
        out.added.push({ from: zeroSpan, to: zeroSpan });
    } else {
        const newSpan = collapseSpan(oldSpan, oldData, oldAxisIndices, oldIndices, range);
        out.removed.push({ from: oldSpan, to: newSpan });
    }
}

function alignSpanToContainingSpan(
    span: Span,
    axisValues: AxisValue[],
    preData: SpanContext,
    postData: SpanContext,
    postSpanIndices: SpanIndices
) {
    const startXValue0 = axisValues[postSpanIndices.xValue0Index];
    const startDatum = preData.data.find((spanDatum) => axisValue(spanDatum.xValue0) === startXValue0);
    const endXValue1 = axisValues[postSpanIndices.xValue1Index];
    const endDatum = preData.data.find((spanDatum) => axisValue(spanDatum.xValue1) === endXValue1);

    if (startDatum == null || endDatum == null) return;

    const [{ x: x0 }, { x: x1 }] = spanRange(span);

    const startX = scale(startDatum.xValue0, preData.scales.x);
    const startY = scale(startDatum.yValue0, preData.scales.y);
    const endX = scale(endDatum.xValue1, preData.scales.x);
    const endY = scale(endDatum.yValue1, preData.scales.y);

    let altSpan = postData.data[postSpanIndices.datumIndex].span;
    altSpan = rescaleSpan(altSpan, { x: startX, y: startY }, { x: endX, y: endY });
    altSpan = clipSpanX(altSpan, x0, x1);

    return altSpan;
}

function appendSpanPhases(
    newData: SpanContext,
    oldData: SpanContext,
    axisValues: AxisValue[],
    xValue0Index: number,
    newAxisIndices: SpanIndices[],
    oldAxisIndices: SpanIndices[],
    range: Pick<SpanIndices, 'xValue0Index' | 'xValue1Index'>,
    out: SpanInterpolationResult
) {
    const xValue1Index = xValue0Index + 1;

    const oldIndices = oldAxisIndices.find((i) => i.xValue0Index <= xValue0Index && i.xValue1Index >= xValue1Index);
    const newIndices = newAxisIndices.find((i) => i.xValue0Index <= xValue0Index && i.xValue1Index >= xValue1Index);

    const oldZeroData = oldData.zeroData;
    const newZeroData = newData.zeroData;

    if (oldIndices == null && newIndices != null) {
        addSpan(newData, newAxisIndices, newIndices, oldZeroData, range, out);
        return;
    } else if (oldIndices != null && newIndices == null) {
        removeSpan(oldData, oldAxisIndices, oldIndices, newZeroData, range, out);
        return;
    } else if (oldIndices == null || newIndices == null) {
        return;
    }

    let ordering: 0 | 1 | -1;
    if (oldIndices.xValue0Index === newIndices.xValue0Index && oldIndices.xValue1Index === newIndices.xValue1Index) {
        // Ranges are equal
        ordering = 0;
    } else if (
        oldIndices.xValue0Index <= newIndices.xValue0Index &&
        oldIndices.xValue1Index >= newIndices.xValue1Index
    ) {
        // Old range contains new range
        ordering = -1;
    } else if (
        oldIndices.xValue0Index >= newIndices.xValue0Index &&
        oldIndices.xValue1Index <= newIndices.xValue1Index
    ) {
        // New range contains old range
        ordering = 1;
    } else {
        // Ranges overlap, but no ordering
        ordering = 0;
    }

    const oldSpanDatum = oldData.data[oldIndices.datumIndex];
    const clippedOldSpanOldScale = clipSpan(oldSpanDatum.span, xValue0Index, oldIndices);

    const newSpanDatum = newData.data[newIndices.datumIndex];
    const clippedNewSpanNewScale = clipSpan(newSpanDatum.span, xValue0Index, newIndices);

    if (ordering === 1) {
        // Removed
        const clippedPostRemoveOldSpanOldScale = alignSpanToContainingSpan(
            clippedOldSpanOldScale,
            axisValues,
            oldData,
            newData,
            newIndices
        );
        if (clippedPostRemoveOldSpanOldScale != null) {
            out.removed.push({ from: clippedOldSpanOldScale, to: clippedPostRemoveOldSpanOldScale });
            out.moved.push({ from: clippedPostRemoveOldSpanOldScale, to: clippedNewSpanNewScale });
            out.added.push({ from: clippedNewSpanNewScale, to: clippedNewSpanNewScale });
        } else {
            removeSpan(oldData, oldAxisIndices, oldIndices, newZeroData, range, out);
        }
    } else if (ordering === -1) {
        // Added
        const clippedPreAddedNewSpanNewScale = alignSpanToContainingSpan(
            clippedNewSpanNewScale,
            axisValues,
            newData,
            oldData,
            oldIndices
        );
        if (clippedPreAddedNewSpanNewScale != null) {
            out.removed.push({ from: clippedOldSpanOldScale, to: clippedOldSpanOldScale });
            out.moved.push({ from: clippedOldSpanOldScale, to: clippedPreAddedNewSpanNewScale });
            out.added.push({ from: clippedPreAddedNewSpanNewScale, to: clippedNewSpanNewScale });
        } else {
            addSpan(newData, newAxisIndices, newIndices, oldZeroData, range, out);
        }
    } else {
        // Updated
        out.removed.push({ from: clippedOldSpanOldScale, to: clippedOldSpanOldScale });
        out.moved.push({ from: clippedOldSpanOldScale, to: clippedNewSpanNewScale });
        out.added.push({ from: clippedNewSpanNewScale, to: clippedNewSpanNewScale });
    }
}

function phaseAnimation(
    axisContext: AxisContext,
    newData: SpanContext,
    oldData: SpanContext,
    out: SpanInterpolationResult
) {
    const { axisValues, oldDataAxisIndices, newDataAxisIndices } = axisContext;
    const range = {
        xValue0Index: Math.max(
            oldDataAxisIndices.at(0)?.xValue0Index ?? -Infinity,
            newDataAxisIndices.at(0)?.xValue0Index ?? -Infinity
        ),
        xValue1Index: Math.min(
            oldDataAxisIndices.at(-1)?.xValue1Index ?? Infinity,
            newDataAxisIndices.at(-1)?.xValue1Index ?? Infinity
        ),
    };
    for (let xValue0Index = 0; xValue0Index < axisValues.length - 1; xValue0Index += 1) {
        appendSpanPhases(
            newData,
            oldData,
            axisValues,
            xValue0Index,
            newDataAxisIndices,
            oldDataAxisIndices,
            range,
            out
        );
    }
}

function resetAnimation(newData: SpanContext, oldData: SpanContext, out: SpanInterpolationResult) {
    for (const oldSpanDatum of oldData.data) {
        const oldSpan = oldSpanDatum.span;
        const zeroSpan = zeroDataSpan(oldSpanDatum, oldData.zeroData) ?? axisZeroSpan(oldSpan, oldData);
        out.removed.push({ from: oldSpan, to: zeroSpan });
    }

    for (const newSpanDatum of newData.data) {
        const newSpan = newSpanDatum.span;
        const zeroSpan = zeroDataSpan(newSpanDatum, newData.zeroData) ?? axisZeroSpan(newSpan, newData);
        out.added.push({ from: zeroSpan, to: newSpan });
    }
}

export function pairUpSpans(newData: SpanContext, oldData: SpanContext) {
    const out: SpanInterpolationResult = {
        removed: [],
        moved: [],
        added: [],
    };

    const axisContext = getAxisValues(newData, oldData);
    if (axisContext == null) {
        resetAnimation(newData, oldData, out);
    } else {
        phaseAnimation(axisContext, newData, oldData, out);
    }

    return out;
}
