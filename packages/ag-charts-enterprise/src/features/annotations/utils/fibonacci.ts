import type { _ModuleSupport } from 'ag-charts-community';

import type { AnnotationContext, FibonacciBands } from '../annotationTypes';

export const FIBONACCI_RETRACEMENT_RATIOS = [0, 23.6, 38.2, 50, 61.8, 78.6, 100];
export const FIBONACCI_EXTENSION_RATIOS = [161.8, 261.8, 361.8, 423.6];
export const FIBONACCI_RATIOS = [...FIBONACCI_RETRACEMENT_RATIOS, ...FIBONACCI_EXTENSION_RATIOS];

const FIBONACCI_RATIOS_MAP: Record<FibonacciBands, number[]> = {
    10: FIBONACCI_RATIOS,
    6: FIBONACCI_RETRACEMENT_RATIOS,
    4: FIBONACCI_RETRACEMENT_RATIOS.filter((r) => r !== 78.6 && r !== 23.6),
};

export const FIBONACCI_RANGE_LABEL_PADDING = 10;

export enum FibonacciNodeTag {
    OneLine,
    HorizontalLine,
}

type FibonacciRangeLabel = _ModuleSupport.Vec4 & { text: string };

export interface FibonacciRangeDatum extends _ModuleSupport.Vec4 {
    id: any;
    tag: FibonacciNodeTag;
    label: FibonacciRangeLabel;
}

export function createFibonacciRangesData(
    { x1, y1, x2, y2 }: _ModuleSupport.Vec4,
    context: AnnotationContext,
    reverse: boolean,
    bands: FibonacciBands = 10
): FibonacciRangeDatum[] {
    const verticalDistance = y2 - y1;

    const direction = reverse ? 1 : -1;
    const y = reverse ? y1 : y2;
    let startY = y;
    const data: FibonacciRangeDatum[] = [];

    FIBONACCI_RATIOS_MAP[bands].forEach((ratio, index) => {
        const endY = y + verticalDistance * (ratio / 100) * direction;
        const yDatumVal = context.yAxis.scaleInvert(endY);

        data.push({
            id: index,
            x1,
            x2,
            y1: startY,
            y2: endY,
            tag: ratio == 100 ? FibonacciNodeTag.OneLine : FibonacciNodeTag.HorizontalLine,
            label: {
                x1: Math.min(x1, x2) - FIBONACCI_RANGE_LABEL_PADDING,
                x2: x2,
                y1: endY,
                y2: endY,
                text: `${(ratio / 100).toFixed(3)} (${yDatumVal.toFixed(2)})`,
            },
        });
        startY = endY;
    });

    return data;
}
