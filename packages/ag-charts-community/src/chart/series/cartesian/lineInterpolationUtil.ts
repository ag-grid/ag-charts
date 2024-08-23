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

function getAxisIndices({ data }: SpanContext, axisValues: any[]): SpanIndices[] {
    return data.map((datum, datumIndex) => ({
        xValue0Index: axisValues.indexOf(datum.xValue0.valueOf()),
        xValue1Index: axisValues.indexOf(datum.xValue1.valueOf()),
        datumIndex,
    }));
}

function getAxisValues(newData: SpanContext, oldData: SpanContext) {
    // Old and new axis values might not be directly comparable
    // Array.sort does not handle this case
    const allAxisValues = new Set<AxisValue>();
    for (const { xValue0, xValue1 } of newData.data) {
        const xValue0ValueOf = xValue0.valueOf();
        const xValue1ValueOf = xValue1.valueOf();
        allAxisValues.add(xValue0ValueOf).add(xValue1ValueOf);
    }

    const newAxisValues = Array.from(allAxisValues).sort((a, b) => {
        return scale(a, newData.scales.x) - scale(b, newData.scales.x);
    });

    const exclusivelyOldAxisValues = [];
    for (const { xValue0, xValue1 } of oldData.data) {
        const xValue0ValueOf = xValue0.valueOf();
        const xValue1ValueOf = xValue1.valueOf();
        if (!allAxisValues.has(xValue0ValueOf)) {
            allAxisValues.add(xValue0ValueOf);
            exclusivelyOldAxisValues.push(xValue0ValueOf);
        }
        if (!allAxisValues.has(xValue1ValueOf)) {
            allAxisValues.add(xValue1ValueOf);
            exclusivelyOldAxisValues.push(xValue1ValueOf);
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
        const datumIndex = axisIndices.findLast((i) => i.xValue1Index <= range.xValue1Index)!.datumIndex;
        const datum = data.data[datumIndex];
        xValue = datum.xValue1;
        yValue = datum.yValue1;
    } else if (indices.xValue0Index <= range.xValue0Index) {
        const datumIndex = axisIndices.find((i) => i.xValue0Index >= range.xValue0Index)!.datumIndex;
        const datum = data.data[datumIndex];
        xValue = datum.xValue0;
        yValue = datum.yValue0;
    } else {
        const [r0, r1] = spanRange(span);
        const y0 = scale(0, data.scales.y);
        return rescaleSpan(span, { x: r0.x, y: y0 }, { x: r1.x, y: y0 });
    }

    const x = scale(xValue, data.scales.x);
    const y = scale(yValue, data.scales.y);
    const point = { x, y };

    return rescaleSpan(span, point, point);
}

function addSpan(
    newData: SpanContext,
    newAxisIndices: SpanIndices[],
    newIndices: SpanIndices,
    range: Pick<SpanIndices, 'xValue0Index' | 'xValue1Index'>,
    out: SpanInterpolationResult
) {
    const newSpan = newData.data[newIndices.datumIndex].span;

    out.added.push({
        from: collapseSpan(newSpan, newData, newAxisIndices, newIndices, range),
        to: newSpan,
    });
}

function removeSpan(
    oldData: SpanContext,
    oldAxisIndices: SpanIndices[],
    oldIndices: SpanIndices,
    range: Pick<SpanIndices, 'xValue0Index' | 'xValue1Index'>,
    out: SpanInterpolationResult
) {
    const oldSpan = oldData.data[oldIndices.datumIndex].span;

    out.removed.push({
        from: oldSpan,
        to: collapseSpan(oldSpan, oldData, oldAxisIndices, oldIndices, range),
    });
}

function alignSpanToContainingSpan(
    span: Span,
    axisValues: AxisValue[],
    preData: SpanContext,
    postData: SpanContext,
    postSpanIndices: SpanIndices
) {
    const startXValue0 = axisValues[postSpanIndices.xValue0Index];
    const startDatum = preData.data.find((spanDatum) => spanDatum.xValue0.valueOf() === startXValue0);
    const endXValue1 = axisValues[postSpanIndices.xValue1Index];
    const endDatum = preData.data.find((spanDatum) => spanDatum.xValue1.valueOf() === endXValue1);

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

    if (oldIndices == null && newIndices != null) {
        addSpan(newData, newAxisIndices, newIndices, range, out);
        return;
    } else if (oldIndices != null && newIndices == null) {
        removeSpan(oldData, oldAxisIndices, oldIndices, range, out);
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
            removeSpan(oldData, oldAxisIndices, oldIndices, range, out);
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
            addSpan(newData, newAxisIndices, newIndices, range, out);
        }
    } else {
        // Updated
        out.removed.push({ from: clippedOldSpanOldScale, to: clippedOldSpanOldScale });
        out.moved.push({ from: clippedOldSpanOldScale, to: clippedNewSpanNewScale });
        out.added.push({ from: clippedNewSpanNewScale, to: clippedNewSpanNewScale });
    }
}

export function pairUpSpans(newData: SpanContext, oldData: SpanContext) {
    const { axisValues, oldDataAxisIndices, newDataAxisIndices } = getAxisValues(newData, oldData);
    const range = {
        xValue0Index: Math.max(oldDataAxisIndices[0].xValue0Index, newDataAxisIndices[0].xValue0Index),
        xValue1Index: Math.min(oldDataAxisIndices.at(-1)!.xValue1Index, newDataAxisIndices.at(-1)!.xValue1Index),
    };
    const out: SpanInterpolationResult = {
        removed: [],
        moved: [],
        added: [],
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

    return out;
}
