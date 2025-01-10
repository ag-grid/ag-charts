import { Logger } from 'ag-charts-core';
import type { AgZoomEvent, AgZoomRange, AgZoomRatio } from 'ag-charts-types';

import type { MementoOriginator } from '../../api/state/memento';
import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { includes } from '../../util/array';
import { BaseManager } from '../../util/baseManager';
import type { BBoxValues } from '../../util/bboxinterface';
import { deepClone } from '../../util/json';
import type { TypedEvent } from '../../util/observable';
import { calcPanToBBoxRatios } from '../../util/panToBBox';
import { StateTracker } from '../../util/stateTracker';
import { isFiniteNumber, isObject } from '../../util/type-guards';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { LayoutManager } from '../layout/layoutManager';
import type { ISeries } from '../series/seriesTypes';

export interface ZoomState {
    min: number;
    max: number;
}

export interface AxisZoomState {
    x?: ZoomState;
    y?: ZoomState;
}

export interface DefinedZoomState {
    x: ZoomState;
    y: ZoomState;
}

export type ZoomMemento = {
    rangeX?: AgZoomRange;
    rangeY?: AgZoomRange;
    ratioX?: AgZoomRatio;
    ratioY?: AgZoomRatio;
    autoScaleYAxis?: boolean;
};

export interface ZoomChangeEvent extends AxisZoomState {
    readonly type: 'zoom-change';
    readonly x?: Readonly<ZoomState>;
    readonly y?: Readonly<ZoomState>;
    readonly callerId: string;
    readonly axes: Record<string, Readonly<ZoomState> | undefined>;
}

export interface ZoomPanStartEvent {
    readonly type: 'zoom-pan-start';
    readonly callerId: string;
}

export type ChartAxisLike = {
    id: string;
    direction: ChartAxisDirection;
    visibleRange: [number, number];
    scale: Scale<any, any>;
    range: [number, number];
    boundSeries: ISeries<any, any>[];
    min?: number;
    max?: number;
};

type ZoomEvents = ZoomChangeEvent | ZoomPanStartEvent;

const expectedMementoKeys: Array<keyof ZoomMemento> = ['rangeX', 'rangeY', 'ratioX', 'ratioY', 'autoScaleYAxis'];

class ZoomManagerAutoScaleAxis {
    enabled = false;
    padding = 0;
    manuallyAdjusted = false;
}

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager<ZoomEvents['type'], ZoomEvents> implements MementoOriginator<ZoomMemento> {
    public mementoOriginatorKey = 'zoom' as const;

    private readonly axisZoomManagers = new Map<string, AxisZoomManager>();
    private readonly state = new StateTracker<AxisZoomState>(undefined, 'initial');

    private axes: ChartAxisLike[] = [];
    private didLayoutAxes = false;

    private readonly autoScaleYAxis = new ZoomManagerAutoScaleAxis();
    private lastRestoredState: AxisZoomState | undefined = undefined;
    private independentAxes = false;
    private navigatorModule = false;
    private zoomModule = false;

    // The initial state memento can not be restored until the chart has performed its first layout. Instead save it as
    // pending and restore then delete it on the first layout.
    private pendingMemento:
        | {
              version: string;
              mementoVersion: string;
              memento: ZoomMemento | undefined;
          }
        | undefined = undefined;

    constructor(
        private readonly fireChartEvent: <TEvent extends TypedEvent>(event: TEvent) => void,
        layoutManager: LayoutManager
    ) {
        super();

        this.destroyFns.push(
            layoutManager.addListener('layout:complete', () => {
                const { pendingMemento } = this;
                const shouldPerformInitialLayout = !this.didLayoutAxes;
                this.didLayoutAxes = true;
                if (pendingMemento) {
                    this.restoreMemento(pendingMemento.version, pendingMemento.mementoVersion, pendingMemento.memento);
                } else if (shouldPerformInitialLayout) {
                    this.autoScaleYZoom('zoom-manager');
                }
            })
        );
    }

    public createMemento() {
        const memento: ZoomMemento = this.getMementoRanges();
        if (this.autoScaleYAxis.enabled) {
            memento.autoScaleYAxis = !this.autoScaleYAxis.manuallyAdjusted;
        }
        return memento;
    }

    public guardMemento(blob: unknown): blob is ZoomMemento | undefined {
        if (blob == null) return true;
        if (!isObject(blob)) return false;

        for (const key of Object.keys(blob)) {
            if (!includes(expectedMementoKeys, key)) {
                return false;
            }
        }

        return true;
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: ZoomMemento | undefined) {
        const { independentAxes } = this;

        if (!this.axes || !this.didLayoutAxes) {
            this.pendingMemento = { version: _version, mementoVersion: _mementoVersion, memento };
            return;
        }
        this.pendingMemento = undefined;

        // Migration from older versions can be implemented here.

        const zoom = this.getDefinedZoom();

        if (memento?.rangeX) {
            zoom.x = this.rangeToRatio(memento.rangeX, ChartAxisDirection.X) ?? { min: 0, max: 1 };
        } else if (memento?.ratioX) {
            zoom.x = {
                min: memento.ratioX.start ?? 0,
                max: memento.ratioX.end ?? 1,
            };
        } else {
            zoom.x = { min: 0, max: 1 };
        }

        // Do not adjust the y-axis zoom if the navigator module is enabled by itself
        if (!this.navigatorModule || this.zoomModule) {
            if (memento?.rangeY) {
                zoom.y = this.rangeToRatio(memento.rangeY, ChartAxisDirection.Y) ?? { min: 0, max: 1 };
            } else if (memento?.ratioY) {
                zoom.y = {
                    min: memento.ratioY.start ?? 0,
                    max: memento.ratioY.end ?? 1,
                };
            } else {
                zoom.y = { min: 0, max: 1 };
            }
        }

        if (memento?.autoScaleYAxis != null) {
            this.autoScaleYAxis.manuallyAdjusted = !memento.autoScaleYAxis;
        }

        this.lastRestoredState = zoom;

        if (independentAxes !== true) {
            this.updateZoom('zoom-manager', zoom);
            return;
        }

        const primaryX = this.getPrimaryAxis(ChartAxisDirection.X);
        const primaryY = this.getPrimaryAxis(ChartAxisDirection.Y);

        for (const axis of [primaryX, primaryY]) {
            if (!axis) continue;
            this.updateAxisZoom('zoom-manager', axis.id, zoom[axis.direction]);
        }
    }

    public updateAxes(axes: Array<ChartAxisLike>) {
        this.axes = axes;

        const zoomManagers = new Map(axes.map((axis) => [axis.id, this.axisZoomManagers.get(axis.id)]));

        this.axisZoomManagers.clear();

        for (const axis of axes) {
            this.axisZoomManagers.set(axis.id, zoomManagers.get(axis.id) ?? new AxisZoomManager(axis));
        }

        if (this.state.size > 0 && axes.length > 0) {
            this.updateZoom(this.state.stateId()!, this.state.stateValue());
        }
    }

    public setIndependentAxes(independent = true) {
        this.independentAxes = independent;
    }

    public setAutoScaleYAxis(enabled: boolean, padding: number) {
        this.autoScaleYAxis.enabled = enabled;
        this.autoScaleYAxis.padding = padding;
    }

    public setNavigatorEnabled(enabled = true) {
        this.navigatorModule = enabled;
    }

    public setZoomModuleEnabled(enabled = true) {
        this.zoomModule = enabled;
    }

    public isZoomEnabled() {
        return this.zoomModule;
    }

    public updateZoom(callerId: string, newZoom?: AxisZoomState) {
        if (this.axisZoomManagers.size === 0) {
            const stateId = this.state.stateId()!;
            if (stateId === 'initial' || stateId === callerId) {
                this.state.set(callerId, newZoom);
            }
            return;
        }

        this.state.set(callerId, newZoom);

        this.axisZoomManagers.forEach((axis) => {
            axis.updateZoom(callerId, newZoom?.[axis.getDirection()]);
        });

        this.applyChanges(callerId);
    }

    public updateAxisZoom(callerId: string, axisId: string, newZoom?: ZoomState) {
        this.axisZoomManagers.get(axisId)?.updateZoom(callerId, newZoom);
        this.applyChanges(callerId);
    }

    public resetZoom(callerId: string) {
        this.autoScaleYAxis.manuallyAdjusted = false;

        // TODO: Move `zoomUtils.ts` to community and use `definedZoomState()` here.
        const zoom = this.getRestoredZoom();
        this.updateZoom(callerId, {
            x: { min: zoom?.x?.min ?? 0, max: zoom?.x?.max ?? 1 },
            y: { min: zoom?.y?.min ?? 0, max: zoom?.y?.max ?? 1 },
        });
    }

    public resetAxisZoom(callerId: string, axisId: string) {
        const axisZoomManager = this.axisZoomManagers.get(axisId);
        const direction = axisZoomManager?.getDirection();
        if (direction == null) return;
        if (direction === ChartAxisDirection.Y) {
            this.autoScaleYAxis.manuallyAdjusted = false;
        }
        this.updateAxisZoom(callerId, axisId, this.getRestoredZoom()?.[direction] ?? { min: 0, max: 1 });
    }

    public setAxisManuallyAdjusted(_callerId: string, axisId: string) {
        const direction = this.axisZoomManagers.get(axisId)?.getDirection();
        if (direction !== ChartAxisDirection.Y) return;
        this.autoScaleYAxis.manuallyAdjusted = true;
    }

    public updatePrimaryAxisZoom(callerId: string, direction: ChartAxisDirection, newZoom?: ZoomState) {
        const primaryAxis = this.getPrimaryAxis(direction);
        if (!primaryAxis) return;
        this.updateAxisZoom(callerId, primaryAxis.id, newZoom);
    }

    public panToBBox(callerId: string, seriesRect: BBox, target: BBoxValues): boolean {
        const zoom = this.getZoom();
        if (zoom === undefined || (!zoom.x && !zoom.y)) return false;

        const panIsPossible =
            seriesRect.width > 0 &&
            seriesRect.height > 0 &&
            Math.abs(target.width) <= Math.abs(seriesRect.width) &&
            Math.abs(target.height) <= Math.abs(seriesRect.height);
        if (!panIsPossible) {
            Logger.warnOnce(`cannot pan to target BBox - chart too small?`);
            return false;
        }

        const newZoom: AxisZoomState = calcPanToBBoxRatios(seriesRect, zoom, target);

        if (this.independentAxes) {
            this.updatePrimaryAxisZoom(callerId, ChartAxisDirection.X, newZoom.x);
            this.updatePrimaryAxisZoom(callerId, ChartAxisDirection.Y, newZoom.y);
        } else {
            this.updateZoom(callerId, newZoom);
        }
        return true;
    }

    // Fire this event to signal to listeners that the view is changing through a zoom and/or pan change.
    public fireZoomPanStartEvent(callerId: string) {
        this.listeners.dispatch('zoom-pan-start', { type: 'zoom-pan-start', callerId });
    }

    public extendToEnd(callerId: string, direction: ChartAxisDirection, extent: number) {
        return this.extendWith(callerId, direction, (end) => Number(end) - extent);
    }

    public extendWith(callerId: string, direction: ChartAxisDirection, fn: (end: Date | number) => Date | number) {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return;

        const extents = this.getDomainExtents(axis);
        if (!extents) return;

        const [, end] = extents;
        const start = fn(end);

        const ratio = this.rangeToRatio({ start, end }, direction);
        if (!ratio) return;

        this.updateZoom(callerId, { [direction]: ratio });
    }

    public updateWith(
        callerId: string,
        direction: ChartAxisDirection,
        fn: (start: Date | number, end: Date | number) => [Date | number, Date | number]
    ) {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return;

        const extents = this.getDomainExtents(axis);
        if (!extents) return;

        let [start, end] = extents;
        [start, end] = fn(start, end);

        const ratio = this.rangeToRatio({ start, end }, direction);
        if (!ratio) return;

        this.updateZoom(callerId, { [direction]: ratio });
    }

    public getZoom(): AxisZoomState | undefined {
        let x: ZoomState | undefined;
        let y: ZoomState | undefined;

        // Use the zoom on the primary (first) axis in each direction
        this.axisZoomManagers.forEach((axis) => {
            if (axis.getDirection() === ChartAxisDirection.X) {
                x ??= axis.getZoom();
            } else if (axis.getDirection() === ChartAxisDirection.Y) {
                y ??= axis.getZoom();
            }
        });

        if (x || y) {
            return { x, y };
        }
    }

    public getAxisZoom(axisId: string): ZoomState {
        return this.axisZoomManagers.get(axisId)?.getZoom() ?? { min: 0, max: 1 };
    }

    public getAxisZooms(): Record<string, { direction: ChartAxisDirection; zoom: ZoomState | undefined }> {
        const axes: Record<string, { direction: ChartAxisDirection; zoom: ZoomState | undefined }> = {};
        for (const [axisId, axis] of this.axisZoomManagers.entries()) {
            axes[axisId] = {
                direction: axis.getDirection(),
                zoom: axis.getZoom(),
            };
        }
        return axes;
    }

    public getRestoredZoom(): AxisZoomState | undefined {
        return this.lastRestoredState;
    }

    private getMementoRanges() {
        const zoom = this.getDefinedZoom();
        return {
            rangeX: this.getRangeDirection(zoom.x, ChartAxisDirection.X),
            rangeY: this.getRangeDirection(zoom.y, ChartAxisDirection.Y),
            ratioX: { start: zoom.x.min, end: zoom.x.max },
            ratioY: { start: zoom.y.min, end: zoom.y.max },
        };
    }

    private autoScaleYZoom(callerId: string, applyChanges = true) {
        const { independentAxes, autoScaleYAxis } = this;

        const zoom = this.getZoom();
        if (zoom?.x == null || !autoScaleYAxis.enabled || autoScaleYAxis.manuallyAdjusted) return;

        const { padding } = autoScaleYAxis;
        const zoomY = independentAxes
            ? this.primaryAxisZoom(ChartAxisDirection.Y, zoom.x, { padding })
            : this.combinedAxisZoom(ChartAxisDirection.Y, zoom.x, { padding });
        if (zoomY == null) return;

        if (independentAxes) {
            const primaryAxis = this.getPrimaryAxis(ChartAxisDirection.Y);
            const primaryAxisManager = primaryAxis == null ? undefined : this.axisZoomManagers.get(primaryAxis.id);
            primaryAxisManager?.updateZoom('zoom-manager', zoomY);
        } else {
            for (const axisZoomManager of this.axisZoomManagers.values()) {
                if (axisZoomManager.getDirection() === ChartAxisDirection.Y) {
                    axisZoomManager.updateZoom('zoom-manager', zoomY);
                }
            }
        }

        if (applyChanges) {
            this.applyChanges(callerId);
        }
    }

    private applyChanges(callerId: string) {
        this.autoScaleYZoom(callerId, false);

        const changed = Array.from(this.axisZoomManagers.values(), (axis) => axis.applyChanges()).includes(true);

        if (!changed) {
            return;
        }

        const axes: Record<string, ZoomState | undefined> = {};
        for (const [axisId, axis] of this.axisZoomManagers.entries()) {
            axes[axisId] = axis.getZoom();
        }

        this.listeners.dispatch('zoom-change', { type: 'zoom-change', ...this.getZoom(), axes, callerId });
        this.fireChartEvent<AgZoomEvent>({ type: 'zoom', ...this.getMementoRanges() });
    }

    private getRangeDirection(ratio: ZoomState, direction: ChartAxisDirection): AgZoomRange | undefined {
        const axis = this.getPrimaryAxis(direction);
        if (!axis || (!ContinuousScale.is(axis.scale) && !OrdinalTimeScale.is(axis.scale))) return;

        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        const [d0, d1] = extents;

        let start;
        let end;

        if (d0 <= d1) {
            start = axis.scale.invert?.(0); // 0 is the start of the visible axis
            end = axis.scale.invert?.(d0 + (d1 - d0) * ratio.max);
        } else {
            start = axis.scale.invert?.(d0 - (d0 - d1) * ratio.min);
            end = axis.scale.invert?.(0);
        }

        return { start, end };
    }

    private rangeToRatio(range: AgZoomRange, direction: ChartAxisDirection): ZoomState | undefined {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return;

        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        const [d0, d1] = extents;

        const r0 = range.start == null ? d0 : axis.scale.convert?.(range.start);
        const r1 = range.end == null ? d1 : axis.scale.convert?.(range.end);
        if (!isFiniteNumber(r0) || !isFiniteNumber(r1)) return;

        const diff = d1 - d0;
        const min = Math.abs((r0 - d0) / diff);
        const max = Math.abs((r1 - d0) / diff);

        return { min, max };
    }

    private getPrimaryAxis(direction: ChartAxisDirection) {
        return this.axes?.find((a) => a.direction === direction);
    }

    private getDomainExtents(axis: ChartAxisLike) {
        const { domain } = axis.scale;
        const d0 = domain.at(0);
        const d1 = domain.at(-1);

        if (d0 == null || d1 == null) return;

        return [d0, d1];
    }

    private getDomainPixelExtents(axis: ChartAxisLike) {
        const { domain } = axis.scale;
        const d0 = axis.scale.convert?.(domain.at(0));
        const d1 = axis.scale.convert?.(domain.at(-1));

        if (!isFiniteNumber(d0) || !isFiniteNumber(d1)) return;

        return [d0, d1];
    }

    private getDefinedZoom(): DefinedZoomState {
        const zoom = this.getZoom();
        return {
            x: { min: zoom?.x?.min ?? 0, max: zoom?.x?.max ?? 1 },
            y: { min: zoom?.y?.min ?? 0, max: zoom?.y?.max ?? 1 },
        };
    }

    private zoomBounds(
        xAxis: ChartAxisLike,
        yAxis: ChartAxisLike,
        zoom: { min: number; max: number },
        padding: number
    ): ZoomState | undefined {
        // Because xScale is only updated after a chart update, working out a visible range
        // will be calculated with unpredictable - but always accurate - numbers
        // However, floating point rounding causes issues when doing that
        // Instead, set the xScale to a consistent range, then just unset it after
        const xScale = xAxis.scale;
        const xScaleRange = xScale.range;
        xScale.range = [0, 1];

        const yScale = yAxis.scale;
        const yScaleRange = yScale.range;
        yScale.range = [0, 1];

        let min = 1;
        let minPadding = false;
        let max = 0;
        let maxPadding = false;
        for (const series of yAxis.boundSeries) {
            const { connectsToYAxis } = series;
            const yValues = series.getRange(ChartAxisDirection.Y, [zoom.min, zoom.max]);

            for (const yValue of yValues) {
                const y = yScale.convert(yValue);

                if (!Number.isFinite(y)) continue;

                if (y < min) {
                    min = y;
                    minPadding = !connectsToYAxis || yValue < 0;
                }

                if (y > max) {
                    max = y;
                    maxPadding = !connectsToYAxis || yValue > 0;
                }
            }
        }

        // We could avoid the loop if both these are set, but it's not worth the complexity
        if (isFiniteNumber(yAxis.min)) {
            min = 0;
        }

        if (isFiniteNumber(yAxis.max)) {
            max = 1;
        }

        xScale.range = xScaleRange;
        yScale.range = yScaleRange;

        if (min >= max) return;

        const totalPadding = (minPadding ? padding : 0) + (maxPadding ? padding : 0);
        const paddedDelta = Math.min((max - min) * (1 + totalPadding), 1);
        if (paddedDelta <= 0) return;

        if (minPadding && maxPadding) {
            const mid = (max + min) / 2;
            min = mid - paddedDelta / 2;
            max = mid + paddedDelta / 2;
        } else if (!minPadding && maxPadding) {
            max = min + paddedDelta;
        } else if (minPadding && !maxPadding) {
            min = max - paddedDelta;
        }

        if (min < 0) {
            max += -min;
            min = 0;
        } else if (max > 1) {
            min -= max - 1;
            max = 1;
        }

        return { min, max };
    }

    private primaryAxisZoom(
        direction: ChartAxisDirection,
        zoom: ZoomState,
        { padding = 0 } = {}
    ): ZoomState | undefined {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const xAxis = this.getPrimaryAxis(crossDirection);
        const yAxis = this.getPrimaryAxis(direction);

        if (xAxis == null || yAxis == null) return;

        return this.zoomBounds(xAxis, yAxis, zoom, padding);
    }

    private combinedAxisZoom(
        direction: ChartAxisDirection,
        zoom: ZoomState,
        { padding = 0 } = {}
    ): ZoomState | undefined {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const seriesXAxes = new Map<any, ChartAxisLike>();
        for (const xAxis of this.axes) {
            if (xAxis.direction !== crossDirection) continue;

            for (const series of xAxis.boundSeries) {
                seriesXAxes.set(series, xAxis);
            }
        }

        let min = 1;
        let max = 0;
        for (const yAxis of this.axes) {
            if (yAxis.direction !== direction) continue;

            for (const series of yAxis.boundSeries) {
                const xAxis = seriesXAxes.get(series);
                if (xAxis == null) continue;

                const bounds = this.zoomBounds(xAxis, yAxis, zoom, padding);
                if (bounds == null) return;

                min = Math.min(min, bounds.min);
                max = Math.max(max, bounds.max);
            }
        }

        const delta = 1e-6;
        if (min < delta) min = 0;
        if (max > 1 - delta) max = 1;

        if (min > max) return;

        return { min, max };
    }
}

class AxisZoomManager {
    private readonly axis: ChartAxisLike;
    private currentZoom: ZoomState;
    private readonly state: StateTracker<ZoomState>;

    constructor(axis: ChartAxisLike) {
        this.axis = axis;

        const [min = 0, max = 1] = axis.visibleRange;
        this.state = new StateTracker({ min, max });
        this.currentZoom = this.state.stateValue()!;
    }

    getDirection(): ChartAxisDirection {
        return this.axis.direction;
    }

    public updateZoom(callerId: string, newZoom?: ZoomState) {
        this.state.set(callerId, newZoom);
    }

    public getZoom() {
        return deepClone(this.state.stateValue()!);
    }

    public hasChanges(): boolean {
        const currentZoom = this.currentZoom;
        const pendingZoom = this.state.stateValue()!;
        return currentZoom.min !== pendingZoom.min || currentZoom.max !== pendingZoom.max;
    }

    public applyChanges(): boolean {
        const hasChanges = this.hasChanges();
        this.currentZoom = this.state.stateValue()!;
        return hasChanges;
    }
}
