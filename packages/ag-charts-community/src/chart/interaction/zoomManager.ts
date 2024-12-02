import type { AgZoomRange, AgZoomRatio } from 'ag-charts-types';

import type { MementoOriginator } from '../../api/state/memento';
import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { includes } from '../../util/array';
import { BaseManager } from '../../util/baseManager';
import type { BBoxValues } from '../../util/bboxinterface';
import { deepClone } from '../../util/json';
import { Logger } from '../../util/logger';
import { findMinMax } from '../../util/number';
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
};

export interface ZoomChangeEvent extends AxisZoomState {
    type: 'zoom-change';
    callerId: string;
    axes: Record<string, ZoomState | undefined>;
}

export interface ZoomPanStartEvent {
    type: 'zoom-pan-start';
    callerId: string;
}

export type ChartAxisLike = {
    id: string;
    direction: ChartAxisDirection;
    visibleRange: [number, number];
    scale: Scale<any, any>;
    range: [number, number];
    boundSeries: ISeries<any, any>[];
};

type ZoomEvents = ZoomChangeEvent | ZoomPanStartEvent;

const expectedMementoKeys: Array<keyof ZoomMemento> = ['rangeX', 'rangeY', 'ratioX', 'ratioY'];

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

    public addLayoutListeners(layoutManager: LayoutManager) {
        this.destroyFns.push(
            layoutManager.addListener('layout:complete', () => {
                const { pendingMemento } = this;
                this.didLayoutAxes = true;
                if (pendingMemento) {
                    this.restoreMemento(pendingMemento.version, pendingMemento.mementoVersion, pendingMemento.memento);
                } else {
                    // Calculate y autoscaling, if enabled
                    this.applyChanges('zoom-manager');
                }
            })
        );
    }

    public createMemento() {
        const zoom = this.getDefinedZoom();
        return {
            rangeX: this.getRangeDirection(zoom.x, ChartAxisDirection.X),
            rangeY: this.getRangeDirection(zoom.y, ChartAxisDirection.Y),
            ratioX: { start: zoom.x.min, end: zoom.x.max },
            ratioY: { start: zoom.y.min, end: zoom.y.max },
        };
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
        this.updateZoom(callerId, this.getRestoredZoom());
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

    public panToBBox(callerId: string, seriesRect: BBox, target: BBoxValues) {
        const zoom = this.getZoom();
        if (zoom === undefined || (!zoom.x && !zoom.y)) return;

        if (target.width > seriesRect.width || target.height > seriesRect.height) {
            Logger.errorOnce(`cannot pan to target BBox`);
            return;
        }

        const newZoom: AxisZoomState = calcPanToBBoxRatios(seriesRect, zoom, target);
        this.updateZoom(callerId, newZoom);
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

    private applyChanges(callerId: string) {
        const { independentAxes, autoScaleYAxis } = this;

        const zoom = this.getZoom();
        if (zoom?.x != null && autoScaleYAxis.enabled && !autoScaleYAxis.manuallyAdjusted) {
            const { padding } = autoScaleYAxis;

            if (independentAxes) {
                const zoomY = this.primaryAxisZoom(ChartAxisDirection.Y, zoom.x, { padding });
                const primaryAxis = this.getPrimaryAxis(ChartAxisDirection.Y);
                const primaryAxisManager = primaryAxis == null ? undefined : this.axisZoomManagers.get(primaryAxis.id);
                primaryAxisManager?.updateZoom('zoom-manager', zoomY);
            } else {
                const zoomY = this.combinedAxisZoom(ChartAxisDirection.Y, zoom.x, { padding });
                for (const axisZoomManager of this.axisZoomManagers.values()) {
                    if (axisZoomManager.getDirection() === ChartAxisDirection.Y) {
                        axisZoomManager.updateZoom('zoom-manager', zoomY);
                    }
                }
            }
        }

        const changed = Array.from(this.axisZoomManagers.values(), (axis) => axis.applyChanges()).includes(true);

        if (!changed) {
            return;
        }

        const axes: Record<string, ZoomState | undefined> = {};
        for (const [axisId, axis] of this.axisZoomManagers.entries()) {
            axes[axisId] = axis.getZoom();
        }

        this.listeners.dispatch('zoom-change', { type: 'zoom-change', ...this.getZoom(), axes, callerId });
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
        const domain = axis.scale.getDomain?.();
        const d0 = domain?.at(0);
        const d1 = domain?.at(-1);

        if (d0 == null || d1 == null) return;

        return [d0, d1];
    }

    private getDomainPixelExtents(axis: ChartAxisLike) {
        const domain = axis.scale.getDomain?.();
        const d0 = axis.scale.convert?.(domain?.at(0));
        const d1 = axis.scale.convert?.(domain?.at(-1));

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
        { min, max }: { min: number; max: number },
        padding: number
    ) {
        const xScale = xAxis.scale;
        let [x0, x1] = xScale.range;
        const dx = x1 - x0;
        x1 = x0 + dx * max;
        x0 = x0 + dx * min;
        const xRange = [x0, x1] as [any, any];

        const yScale = yAxis.scale;
        const [r0, r1] = findMinMax(yScale.range);
        const r = r1 - r0;

        const height = Math.max(...yAxis.range);
        const zoomPadding = (height * padding) / r;

        let bounds0 = 1;
        let bounds1 = 0;
        for (const series of yAxis.boundSeries) {
            const yRange = series.getRange(ChartAxisDirection.Y, xRange);

            let y0 = yScale.convert(yRange[0])?.valueOf();
            let y1 = yScale.convert(yRange[1])?.valueOf();
            if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;

            [y0, y1] = findMinMax([y0, y1]);
            y0 = (y0 - r0) / r;
            y1 = (y1 - r0) / r;

            const { connectsToYAxis } = series;
            if (!connectsToYAxis || yRange[1] > 0) y0 = Math.max(y0 - zoomPadding, 0);
            if (!connectsToYAxis || yRange[0] < 0) y1 = Math.min(y1 + zoomPadding, 1);

            bounds0 = Math.min(bounds0, y0);
            bounds1 = Math.max(bounds1, y1);
        }

        return [bounds0, bounds1];
    }

    private boundsZoom(bounds0: number, bounds1: number) {
        if (bounds0 > bounds1) {
            return { min: 0, max: 1 };
        }

        return { min: 1 - bounds1, max: 1 - bounds0 };
    }

    private primaryAxisZoom(direction: ChartAxisDirection, zoom: ZoomState, { padding = 0 } = {}) {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const xAxis = this.getPrimaryAxis(crossDirection);
        const yAxis = this.getPrimaryAxis(direction);

        if (xAxis == null || yAxis == null) return { min: 0, max: 1 };

        const [y0, y1] = this.zoomBounds(xAxis, yAxis, zoom, padding);
        return this.boundsZoom(y0, y1);
    }

    private combinedAxisZoom(direction: ChartAxisDirection, zoom: ZoomState, { padding = 0 } = {}) {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const seriesXAxes = new Map<any, ChartAxisLike>();
        for (const xAxis of this.axes) {
            if (xAxis.direction !== crossDirection) continue;

            for (const series of xAxis.boundSeries) {
                seriesXAxes.set(series, xAxis);
            }
        }

        let bounds0 = 1;
        let bounds1 = 0;
        for (const yAxis of this.axes) {
            if (yAxis.direction !== direction) continue;

            for (const series of yAxis.boundSeries) {
                const xAxis = seriesXAxes.get(series);
                if (xAxis == null) continue;

                const [y0, y1] = this.zoomBounds(xAxis, yAxis, zoom, padding);
                bounds0 = Math.min(bounds0, y0);
                bounds1 = Math.max(bounds1, y1);
            }
        }

        return this.boundsZoom(bounds0, bounds1);
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
        const prevZoom = this.currentZoom;
        const nextZoom = this.state.stateValue()!;
        return prevZoom.min !== nextZoom.min || prevZoom.max !== nextZoom.max;
    }

    public applyChanges(): boolean {
        const hasChanges = this.hasChanges();
        this.currentZoom = this.state.stateValue()!;
        return hasChanges;
    }
}
