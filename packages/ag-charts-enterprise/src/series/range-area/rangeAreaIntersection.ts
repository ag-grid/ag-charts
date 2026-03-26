import { type FillOptions, _ModuleSupport } from 'ag-charts-community';
import { type Point, type Size, spanRange } from 'ag-charts-core';

function getYValueAtX({ span }: _ModuleSupport.LinePathSpan, x: number): number {
    switch (span.type) {
        case 'linear':
        case 'step':
        case 'multi-line': {
            const t = (x - span.x0) / (span.x1 - span.x0);
            return span.y0 + t * (span.y1 - span.y0);
        }
        case 'cubic': {
            const { cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y } = span;

            // find t where cubic x(t) = x
            let t = 0.5;
            const tolerance = 1e-6;

            for (let i = 0; i < 10; i++) {
                const mt = 1 - t;

                // Calculate x(t) - x coordinate of the cubic Bézier curve at parameter t
                const xt = mt * mt * mt * cp0x + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * cp3x;
                const fx = xt - x;

                if (Math.abs(fx) < tolerance) break;

                // Calculate derivative dx/dt for next guess
                const dxdt = 3 * mt * mt * (cp1x - cp0x) + 6 * mt * t * (cp2x - cp1x) + 3 * t * t * (cp3x - cp2x);

                if (Math.abs(dxdt) < 1e-12) break;

                t = t - fx / dxdt;
                t = Math.max(0, Math.min(1, t));
            }

            // calculate y at found t
            const mt = 1 - t;
            return mt * mt * mt * cp0y + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * cp3y;
        }
    }
}

function findSpanForX(
    spans: _ModuleSupport.LinePathSpan[],
    x: number,
    startIndex: number = 0
): { span: _ModuleSupport.LinePathSpan | null; index: number } {
    for (let i = startIndex; i < spans.length; i++) {
        const span = spans[i];
        const [start, end] = spanRange(span.span);

        if (x >= start.x && x <= end.x) {
            return { span, index: i };
        }

        if (x < start.x) {
            break;
        }
    }

    return { span: null, index: startIndex };
}

function checkForIntersection(
    highSpans: _ModuleSupport.LinePathSpan[],
    lowSpans: _ModuleSupport.LinePathSpan[],
    x: number,
    wasInverted: boolean,
    spanIndex: number
): { intersection: Point | null; spanIndex: number; isInverted: boolean } {
    const high = findSpanForX(highSpans, x, spanIndex);
    const low = findSpanForX(lowSpans, x, spanIndex);

    if (!high.span || !low.span) {
        return { intersection: null, spanIndex: high.index, isInverted: wasInverted };
    }

    const highY = getYValueAtX(high.span, x);
    const lowY = getYValueAtX(low.span, x);

    const isInverted = highY > lowY;
    const intersection = wasInverted === isInverted ? null : { x, y: highY };

    return { intersection, spanIndex: high.index, isInverted };
}

export function findRangeAreaIntersections(
    highSpans: _ModuleSupport.LinePathSpan[],
    lowSpans: _ModuleSupport.LinePathSpan[],
    minX: number,
    maxX: number,
    initiallyInverted: boolean = false
): number[] {
    if (highSpans.length === 0 || lowSpans.length === 0) return [];

    const intersections: number[] = [];
    let wasInverted = initiallyInverted;
    let spanIndex = 0;

    for (let x = minX; x <= maxX; x += 0.5) {
        const result = checkForIntersection(highSpans, lowSpans, x, wasInverted, spanIndex);

        if (result.intersection) {
            intersections.push(result.intersection.x);
        }

        spanIndex = result.spanIndex;
        wasInverted = result.isInverted;
    }

    return intersections;
}

export function calculateIntersectionSegments(
    intersections: number[],
    seriesRect: _ModuleSupport.BBox,
    chartSize: Size,
    startsInverted: boolean,
    style: FillOptions = {}
) {
    const horizontalMargin = Math.max(seriesRect.x, chartSize.width - (seriesRect.x + seriesRect.width));
    const verticalMargin = Math.max(seriesRect.y, chartSize.height - (seriesRect.y + seriesRect.height));
    const result: _ModuleSupport.Segment[] = [];

    const createClipRect = (x0: number, x1: number) => ({
        x0,
        y0: -verticalMargin,
        x1,
        y1: seriesRect.height + verticalMargin,
    });

    // initial segment if starts inverted
    if (startsInverted) {
        result.push({
            clipRect: createClipRect(-horizontalMargin, intersections[0] ?? seriesRect.width + horizontalMargin),
            ...style,
        });
    }

    const startIndex = startsInverted ? 1 : 0;
    for (let i = startIndex; i < intersections.length; i += 2) {
        result.push({
            clipRect: createClipRect(intersections[i], intersections[i + 1] ?? seriesRect.width + horizontalMargin),
            ...style,
        });
    }

    return result;
}
