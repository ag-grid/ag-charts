import type { BoundingBox } from 'ag-charts-core';
import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { Scale } from '../scale/scale';
import type { Node } from '../scene/node';

export interface AxisContext {
    context?: unknown;
    axisId: string;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    scale: Scale<any, any, any>;
    getCanvasBounds(): BoundingBox | undefined;
    seriesKeyProperties(): Set<string>;
    seriesIds(): string[];
    scaleInvert(position: number): any;
    scaleInvertNearest(position: number): any;
    scaleValueFormatter(specifier?: string): (x: any) => string;
    attachLabel(node: Node): void;
    inRange(value: number, tolerance?: number): boolean;
    getRangeOverflow(value: number): number;
}
