import type {
    AxisID,
    BoxBounds,
    ChartAxisDirection,
    CurrentPoint,
    NormalisedTextOrSegments,
    Point,
    Scale,
} from 'ag-charts-core';
import type {
    AgAxisBoundSeries,
    AgAxisDomain,
    AgAxisListeners,
    AgAxisValue,
    AgCartesianAxisPosition,
    FormatterParams,
} from 'ag-charts-types';

import type { Group } from '../scene/group';
import type { Node } from '../scene/node';

export type ContextFormatter<Params> = (
    fn: (params: Params) => NormalisedTextOrSegments | undefined,
    params: Params
) => NormalisedTextOrSegments | undefined;

export interface AxisFormattableLabel<FormatParams extends object, Params extends object = FormatParams> {
    formatValue(
        formatInContext: ContextFormatter<FormatParams>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: Params
    ): NormalisedTextOrSegments | undefined;
}

export interface AxisValuePick {
    readonly caller: { context?: unknown };
    readonly axisId: string;
    readonly value: AgAxisValue;
    readonly index: number;
    readonly direction: ChartAxisDirection;
    readonly boundSeries: AgAxisBoundSeries[];
    readonly domain: AgAxisDomain;
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
 * Polar-axis layout snapshot. Defined only on polar axes (`AngleAxis` / `RadiusAxis`) via
 * {@link AxisContext.getPolarLayout}; cartesian axes leave it undefined. Describes the polar
 * axis's own layout — generic axis state, not specific to any one plugin. `ticks` is populated
 * for angle axes; `gridAngles` for radius axes.
 */
export interface PolarAxisLayout {
    rotation: number;
    parallelFlipRotation: number;
    regularFlipRotation: number;
    shape: 'polygon' | 'circle';
    axisOuterRadius: number;
    axisInnerRadius: number;
    ticks?: unknown[];
    gridAngles?: number[];
}

export interface AxisContext {
    context?: unknown;
    /** User-supplied `axes[].listeners`, if any. */
    readonly listeners?: AgAxisListeners<unknown>;
    axisId: AxisID;
    /** Static axis-type identifier (matches the axis module's name, e.g. `'number'`, `'angle-category'`). */
    readonly axisType: string;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    scale: Scale<any, any, any>;
    readonly mirrored: boolean;
    readonly reverse: boolean;
    readonly gridLength: number;
    readonly gridPadding: number;
    readonly range: readonly [number, number];
    hasDefinedDomain(): boolean;
    hasVisibleSeries(): boolean;
    getCanvasBounds(): BoxBounds | undefined;
    seriesKeyProperties(): Set<string>;
    seriesIds(): string[];
    scaleInvert(position: number): any;
    formatScaleValue<FormatParams extends object = never>(
        value: unknown,
        source: 'annotation-label' | 'crosshair',
        label?: AxisFormattableLabel<FormatParams, FormatterParams<any>>
    ): string;
    attachLabel(node: Node): void;
    /**
     * Attaches a plugin-owned scene group into one of three z-index-ordered overlay slots that
     * follow the axis transform. The slot order (`'low' | 'mid' | 'high'`) describes z-index
     * only — it carries no semantic about what gets drawn — so plugins choose the layer that
     * matches their rendering needs without the axis having to enumerate consumer roles.
     */
    attachAxisOverlay(group: Group, slot: 'low' | 'mid' | 'high'): void;
    inRange(value: number, tolerance?: number): boolean;
    getRangeOverflow(value: number): number;
    /** Pick the scale value at a current-point (click/contextmenu events), relative to axis-dom-proxy HTML element */
    pickValue(point: CurrentPoint): AxisValuePick | undefined;
    pickBand(point: Point): AxisBandDatum | undefined;
    measureBand(value: string): AxisBandMeasurement | undefined;
    /** Defined only on polar axes; cartesian axes leave it undefined. */
    getPolarLayout?(): PolarAxisLayout;
}
