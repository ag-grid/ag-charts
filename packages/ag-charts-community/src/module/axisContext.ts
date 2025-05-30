import type { BoxBounds } from 'ag-charts-core';
import type { AgCartesianAxisPosition } from 'ag-charts-types';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { Scale } from '../scale/scale';
import type { Node } from '../scene/node';
import type { Point } from '../scene/point';

export type ContextFormatter<Params> = (
    fn: (params: Params) => string | undefined,
    params: Params
) => string | undefined;

export interface AxisFormattableLabel<Params extends object> {
    formatValue(
        formatInContext: ContextFormatter<Params>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: Params
    ): string | undefined;
}

export interface AxisBandDatum {
    readonly id: string;
    readonly value: any;
    readonly band: [number, number];
    readonly position: number;
}

export interface AxisContext {
    context?: unknown;
    axisId: string;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    scale: Scale<any, any, any>;
    getCanvasBounds(): BoxBounds | undefined;
    seriesKeyProperties(): Set<string>;
    seriesIds(): string[];
    scaleInvert(position: number): any;
    scaleInvertNearest(position: number): any;
    formatScaleValue(value: unknown, source: 'crosshair', label?: AxisFormattableLabel<never>): string;
    attachLabel(node: Node): void;
    inRange(value: number, tolerance?: number): boolean;
    getRangeOverflow(value: number): number;
    pickBand(point: Point): AxisBandDatum | undefined;
}
