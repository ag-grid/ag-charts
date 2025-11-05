import type { AxisID, BoxBounds, Point, Scale } from 'ag-charts-core';
import type { AgCartesianAxisPosition, FormatterParams, TextOrSegments } from 'ag-charts-types';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { Node } from '../scene/node';

export type ContextFormatter<Params> = (
    fn: (params: Params) => TextOrSegments | undefined,
    params: Params
) => TextOrSegments | undefined;

export interface AxisFormattableLabel<FormatParams extends object, Params extends object = FormatParams> {
    formatValue(
        formatInContext: ContextFormatter<FormatParams>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: Params
    ): TextOrSegments | undefined;
}

export interface AxisBandDatum {
    readonly id: string;
    readonly value: any;
    readonly band: [number, number];
    readonly position: number;
}

export interface AxisContext {
    context?: unknown;
    axisId: AxisID;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    scale: Scale<any, any, any>;
    getCanvasBounds(): BoxBounds | undefined;
    seriesKeyProperties(): Set<string>;
    seriesIds(): string[];
    scaleInvert(position: number): any;
    scaleInvertNearest(position: number): any;
    formatScaleValue<FormatParams extends object = never>(
        value: unknown,
        source: 'annotation-label' | 'crosshair',
        label?: AxisFormattableLabel<FormatParams, FormatterParams<any>>
    ): string;
    attachLabel(node: Node): void;
    inRange(value: number, tolerance?: number): boolean;
    getRangeOverflow(value: number): number;
    pickBand(point: Point): AxisBandDatum | undefined;
}
