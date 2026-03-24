import type { Bounds4 } from 'ag-charts-core';

import type { AnnotationContext, FibonacciBands } from '../annotationTypes';

const FIBONACCI_RETRACEMENT_RATIOS = [0, 23.6, 38.2, 50, 61.8, 78.6, 100];
const FIBONACCI_EXTENSION_RATIOS = [161.8, 261.8, 361.8, 423.6];
const FIBONACCI_RATIOS = [...FIBONACCI_RETRACEMENT_RATIOS, ...FIBONACCI_EXTENSION_RATIOS];

const FIBONACCI_RATIOS_MAP: Record<FibonacciBands, number[]> = {
    10: FIBONACCI_RATIOS,
    6: FIBONACCI_RETRACEMENT_RATIOS,
    4: FIBONACCI_RETRACEMENT_RATIOS.filter((r) => r !== 78.6 && r !== 23.6),
};

const FIBONACCI_RANGE_LABEL_PADDING = 10;

export enum FibonacciNodeTag {
    OneLine,
    HorizontalLine,
}

type FibonacciRangeLabel = Bounds4 & { text: string };

export interface FibonacciRangeDatum extends Bounds4 {
    id: any;
    tag: FibonacciNodeTag;
    label: FibonacciRangeLabel;
}

export function getFibonacciCoords(coords1: Bounds4, coords2?: Bounds4) {
    const { x2, y1, y2 } = coords1;

    const trendLineVerticalDistance = y1 - y2;

    if (coords2 == null) {
        return {
            x1: x2,
            x2: x2,
            y1: y2 - trendLineVerticalDistance,
            y2: y2,
        };
    }

    return {
        x1: coords2.x1,
        x2: coords2.x2,
        y1: coords2.y2 - trendLineVerticalDistance,
        y2: coords2.y2,
    };
}

export function createFibonacciRangesData(
    { x1, y1, x2, y2 }: Bounds4,
    context: AnnotationContext,
    reverse: boolean,
    yZero: number,
    bands: FibonacciBands = 10
): FibonacciRangeDatum[] {
    const verticalDistance = y1 - y2;
    const direction = reverse ? -1 : 1;
    const data: FibonacciRangeDatum[] = [];
    const { yAxis, isRtl } = context;
    let startY = yZero;

    for (const [index, ratio] of FIBONACCI_RATIOS_MAP[bands].entries()) {
        const endY = yZero + verticalDistance * (ratio / 100) * direction;
        const yDatumVal = yAxis.scaleInvert(endY);

        data.push({
            id: index,
            x1,
            x2,
            y1: startY,
            y2: endY,
            tag: ratio == 100 ? FibonacciNodeTag.OneLine : FibonacciNodeTag.HorizontalLine,
            label: {
                x1: isRtl
                    ? Math.max(x1, x2) + FIBONACCI_RANGE_LABEL_PADDING
                    : Math.min(x1, x2) - FIBONACCI_RANGE_LABEL_PADDING,
                x2: x2,
                y1: endY,
                y2: endY,
                text: isRtl
                    ? `(${yDatumVal.toFixed(2)}) ${(ratio / 100).toFixed(3)}`
                    : `${(ratio / 100).toFixed(3)} (${yDatumVal.toFixed(2)})`,
            },
        });
        startY = endY;
    }

    return data;
}
