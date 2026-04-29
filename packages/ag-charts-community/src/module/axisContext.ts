import type { AxisID, BoxBounds, ChartAxisDirection, Point, Scale } from 'ag-charts-core';
import type { AgCartesianAxisPosition, FormatterParams, TextOrSegments } from 'ag-charts-types';

import type { CrossLine } from '../chart/crossline/crossLine';
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

export interface AxisBandMeasurement {
    readonly band: [number, number];
}

export interface AxisBandDatum extends AxisBandMeasurement {
    readonly id: string;
    readonly value: any;
    readonly position: number;
}

/**
 * Axis-specific hooks consumed by the {@link CrossLinesPlugin}. The hooks bundle
 * the axis-side surface that cross-lines need (factory + scene-graph wiring +
 * lifecycle helpers) so that the plugin never receives the axis instance
 * directly. Present iff the axis supports cross-lines.
 */
export interface AxisCrossLineHooks {
    createCrossLine(): CrossLine;
    attachCrossLine(crossLine: CrossLine): void;
    detachCrossLine(crossLine: CrossLine): void;
    initCrossLine(crossLine: CrossLine): void;
}

export interface AxisContext {
    context?: unknown;
    axisId: AxisID;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    scale: Scale<any, any, any>;
    crossLineHooks?: AxisCrossLineHooks;
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
    measureBand(value: string): AxisBandMeasurement | undefined;
}
