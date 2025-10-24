import {
    type BoxBounds,
    Logger,
    type OptionsDefs,
    type RequireOptional,
    type Scale,
    ScaleAlignment,
    attachDescription,
    defined,
    isFiniteNumber,
    isObject,
    validate,
} from 'ag-charts-core';
import type { AgAutoScaledAxes, AgZoomEvent, AgZoomRange, AgZoomRatio } from 'ag-charts-types';

import type { AxisZoomState, EventsHub, ZoomState } from '../../core/eventsHub';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { BBox } from '../../scene/bbox';
import { BaseManager } from '../../util/baseManager';
import { deepClone } from '../../util/json';
import { objectsEqual } from '../../util/object';
import type { TypedEvent } from '../../util/observable';
import { calcPanToBBoxRatios } from '../../util/panToBBox';
import { StateTracker } from '../../util/stateTracker';
import { type CartesianAxisDirection, ChartAxisDirection } from '../chartAxisDirection';
import { rangeAlignment } from '../rangeAlignment';
import type { ISeries } from '../series/seriesTypes';

export interface DefinedZoomState {
    x: ZoomState;
    y: ZoomState;
}

export type ZoomMemento = {
    rangeX?: AgZoomRange;
    rangeY?: AgZoomRange;
    ratioX?: AgZoomRatio;
    ratioY?: AgZoomRatio;
    autoScaledAxes?: AgAutoScaledAxes;
};

export type ChartAxisLike = {
    id: string;
    direction: ChartAxisDirection;
    visibleRange: [number, number];
    scale: Scale<any, any>;
    range: [number, number];
    boundSeries: ISeries<any, any, any>[];
    min?: number;
    max?: number;
};

class ZoomManagerAutoScaleAxis {
    enabled = false;
    padding = 0;
    manuallyAdjusted = false;
}

const rangeValidator = (axis?: ChartAxisLike) =>
    attachDescription((value, { options }) => {
        if (!ContinuousScale.is(axis?.scale) && !DiscreteTimeScale.is(axis?.scale)) return true;
        if (value == null || options.end == null) return true;
        return value < options.end;
    }, `to be less than end`);

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager {
    public mementoOriginatorKey = 'zoom' as const;

    private readonly axisZoomManagers = new Map<string, AxisZoomManager>();
    private readonly state = new StateTracker<AxisZoomState>(undefined, 'initial');

    private readonly axes: ChartAxisLike[] = [];
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
        private readonly eventsHub: EventsHub,
        private readonly fireChartEvent: <TEvent extends TypedEvent>(event: TEvent) => void
    ) {
        super();

        this.cleanup.register(
            eventsHub.on('layout:complete', () => {
                this.didLayoutAxes = true;

                const { pendingMemento } = this;
                if (pendingMemento) {
                    this.restoreMemento(pendingMemento.version, pendingMemento.mementoVersion, pendingMemento.memento);
                }

                this.autoScaleYZoom('zoom-manager');
            })
        );
    }

    public createMemento() {
        return this.getMementoRanges() as ZoomMemento;
    }

    public guardMemento(blob: unknown, messages: string[]): blob is ZoomMemento | undefined {
        if (blob == null) return true;
        if (!isObject(blob)) return false;

        const primaryX = this.getPrimaryAxis(ChartAxisDirection.X);
        const primaryY = this.getPrimaryAxis(ChartAxisDirection.Y);

        // Already validated by the optionsModule validator
        const zoomMementoDefs: OptionsDefs<ZoomMemento> = {
            rangeX: { start: rangeValidator(primaryX), end: defined },
            rangeY: { start: rangeValidator(primaryY), end: defined },
            ratioX: { start: defined, end: defined },
            ratioY: { start: defined, end: defined },
            autoScaledAxes: defined,
        };

        const { invalid } = validate(blob, zoomMementoDefs);
        if (invalid.length > 0) {
            messages.push(...invalid.map(String));
            return false;
        }

        return true;
    }

    public restoreMemento(version: string, mementoVersion: string, memento: ZoomMemento | undefined) {
        const { independentAxes } = this;

        if (!this.axes || !this.didLayoutAxes) {
            this.pendingMemento = { version, mementoVersion, memento };
            return;
        }
        this.pendingMemento = undefined;

        // Migration from older versions can be implemented here.

        const zoom: AxisZoomState = this.getDefinedZoom();

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
            let yAutoScale: boolean | undefined = memento?.autoScaledAxes?.includes('y');
            if (memento?.rangeY) {
                yAutoScale ??= false;
                zoom.y = this.rangeToRatio(memento.rangeY, ChartAxisDirection.Y) ?? { min: 0, max: 1 };
            } else if (memento?.ratioY) {
                yAutoScale ??= false;
                zoom.y = {
                    min: memento.ratioY.start ?? 0,
                    max: memento.ratioY.end ?? 1,
                };
            } else {
                yAutoScale ??= true;
                const autoZoomY = yAutoScale ? this.getAutoScaleYZoom(zoom.x) : undefined;
                zoom.y = autoZoomY ?? { min: 0, max: 1 };
            }

            zoom.autoScaleYAxis = yAutoScale;
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
            this.updateAxisZoom('zoom-manager', axis.id, zoom[axis.direction as keyof DefinedZoomState]);
        }
    }

    public updateAxes(nextAxes: Array<ChartAxisLike | CartesianAxisDirection>) {
        const { axes, axisZoomManagers } = this;

        const existingZoomManagers = new Map(axisZoomManagers);
        axisZoomManagers.clear();

        axes.length = 0;
        for (const axis of nextAxes) {
            if (typeof axis === 'string') {
                axisZoomManagers.set(axis, existingZoomManagers.get(axis) ?? new AxisZoomManager(axis));
            } else {
                axes.push(axis);
                axisZoomManagers.set(axis.id, existingZoomManagers.get(axis.id) ?? new AxisZoomManager(axis));
            }
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

        if (enabled) {
            this.autoScaleYZoom('toggle-auto-scale');
        }
    }

    public setNavigatorEnabled(enabled = true) {
        this.navigatorModule = enabled;
    }

    public setZoomModuleEnabled(enabled = true) {
        this.zoomModule = enabled;
    }

    public isNavigatorEnabled() {
        return this.navigatorModule;
    }

    public isZoomEnabled() {
        return this.zoomModule;
    }

    public updateZoom(callerId: string, newZoom?: AxisZoomState) {
        if (newZoom?.x && (newZoom.x.min < 0 || newZoom.x.max > 1)) {
            Logger.warnOnce(
                `Attempted to update x-axis zoom to an invalid ratio of [{ min: ${newZoom.x.min}, max: ${newZoom.x.max} }], expecting a ratio of 0 to 1, ignoring.`
            );
            newZoom.x = undefined;
        }

        if (newZoom?.y && (newZoom.y.min < 0 || newZoom.y.max > 1)) {
            Logger.warnOnce(
                `Attempted to update y-axis zoom to an invalid ratio of [{ min: ${newZoom.y.min}, max: ${newZoom.y.max} }], expecting a ratio of 0 to 1, ignoring.`
            );
            newZoom.y = undefined;
        }

        if (this.axisZoomManagers.size === 0) {
            const stateId = this.state.stateId()!;
            if (stateId === 'initial' || stateId === callerId) {
                this.state.set(callerId, newZoom);
            }
            return;
        }

        this.state.set(callerId, newZoom);

        const autoScaleYAxis = newZoom?.autoScaleYAxis;
        if (autoScaleYAxis != null) {
            this.autoScaleYAxis.manuallyAdjusted = !autoScaleYAxis;
        }

        for (const axis of this.axisZoomManagers.values()) {
            axis.updateZoom(callerId, newZoom?.[axis.direction]);
        }

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
            autoScaleYAxis: zoom?.autoScaleYAxis ?? true,
        });
    }

    public resetAxisZoom(callerId: string, axisId: string) {
        const axisZoomManager = this.axisZoomManagers.get(axisId);
        const direction = axisZoomManager?.direction;
        if (direction == null) return;
        const restoredZoom = this.getRestoredZoom();
        if (direction === ChartAxisDirection.Y) {
            const autoScaleYAxis = restoredZoom?.autoScaleYAxis ?? true;
            this.autoScaleYAxis.manuallyAdjusted = !autoScaleYAxis;
        }
        for (const axis of this.axes) {
            if (axis.direction !== direction) continue;
            this.updateAxisZoom(callerId, axis.id, restoredZoom?.[direction] ?? { min: 0, max: 1 });
        }
    }

    public setAxisManuallyAdjusted(_callerId: string, axisId: string) {
        const direction = this.axisZoomManagers.get(axisId)?.direction;
        if (direction !== ChartAxisDirection.Y) return;
        this.autoScaleYAxis.manuallyAdjusted = true;
    }

    public updatePrimaryAxisZoom(callerId: string, direction: ChartAxisDirection, newZoom?: ZoomState) {
        const primaryAxis = this.getPrimaryAxis(direction);
        if (!primaryAxis) return;
        this.updateAxisZoom(callerId, primaryAxis.id, newZoom);
    }

    public panToBBox(callerId: string, seriesRect: BBox, target: BoxBounds): boolean {
        if (!this.isZoomEnabled() && !this.isNavigatorEnabled()) return false;

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
        this.eventsHub.emit('zoom:pan-start', { callerId });
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

        const ratio = this.rangeToRatio({ start }, direction);
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
        for (const axis of this.axisZoomManagers.values()) {
            if (axis.direction === ChartAxisDirection.X) {
                x ??= axis.getZoom();
            } else if (axis.direction === ChartAxisDirection.Y) {
                y ??= axis.getZoom();
            }
        }

        if (x || y) {
            return { x, y };
        }
    }

    public getAxisZoom(axisId: string): ZoomState {
        return this.axisZoomManagers.get(axisId)?.getZoom() ?? { min: 0, max: 1 };
    }

    public getAxisZooms(): Record<string, { direction: ChartAxisDirection; zoom: ZoomState }> {
        const axes: Record<string, { direction: ChartAxisDirection; zoom: ZoomState }> = {};
        for (const [axisId, axis] of this.axisZoomManagers.entries()) {
            axes[axisId] = {
                direction: axis.direction,
                zoom: axis.getZoom(),
            };
        }
        return axes;
    }

    public getRestoredZoom(): AxisZoomState | undefined {
        return this.lastRestoredState;
    }

    public getPrimaryAxisId(direction: ChartAxisDirection) {
        return this.getPrimaryAxis(direction)?.id;
    }

    private getBoundSeries() {
        const xAxis = this.getPrimaryAxis(ChartAxisDirection.X);
        const yAxis = this.getPrimaryAxis(ChartAxisDirection.Y);

        let boundSeries: Set<ISeries<any, any, any>>;

        if (this.independentAxes) {
            const xBoundSeries = new Set(xAxis?.boundSeries ?? []);
            const yBoundSeries = new Set(yAxis?.boundSeries ?? []);

            boundSeries = new Set();
            for (const series of xBoundSeries) {
                if (yBoundSeries.has(series)) {
                    boundSeries.add(series);
                }
            }
        } else {
            boundSeries = new Set([...(xAxis?.boundSeries ?? []), ...(yAxis?.boundSeries ?? [])]);
        }

        return boundSeries;
    }

    public constrainZoomToItemCount(zoom: DefinedZoomState, minVisibleItems: number): DefinedZoomState | undefined {
        const { autoScaleYAxis } = this;
        const shouldAutoscale = autoScaleYAxis.enabled && !autoScaleYAxis.manuallyAdjusted;

        let xVisibleRange: [number, number] = [zoom.x.min, zoom.x.max];
        let yVisibleRange: [number, number] | undefined = shouldAutoscale ? undefined : [zoom.y.min, zoom.y.max];
        for (const series of this.getBoundSeries()) {
            const nextZoom = series.getZoomRangeFittingItems(xVisibleRange, yVisibleRange, minVisibleItems);
            if (nextZoom == null) return;

            xVisibleRange = nextZoom.x;
            yVisibleRange = nextZoom.y;
        }

        const xZoom: ZoomState = { min: xVisibleRange[0], max: xVisibleRange[1] };
        let yZoom: ZoomState | undefined;

        yZoom ??= this.getAutoScaleYZoom(xZoom);
        if (yVisibleRange) {
            yZoom = { min: yVisibleRange[0], max: yVisibleRange[1] };
        }

        if (yZoom == null) return;

        return { x: xZoom, y: yZoom };
    }

    public isVisibleItemsCountAtLeast(
        zoom: DefinedZoomState,
        minVisibleItems: number,
        includeYVisibleRange?: boolean
    ): boolean {
        const { autoScaleYAxis } = this;
        const boundSeries = this.getBoundSeries();

        const xVisibleRange: [number, number] = [zoom.x.min, zoom.x.max];
        const yVisibleRange: [number, number] | undefined =
            !includeYVisibleRange && autoScaleYAxis.enabled && !autoScaleYAxis.manuallyAdjusted
                ? undefined
                : [zoom.y.min, zoom.y.max];

        let visibleItemsCount = 0;

        for (const series of boundSeries) {
            const remainingItems = minVisibleItems - (visibleItemsCount ?? 0);
            const seriesVisibleItems = series.getVisibleItems(xVisibleRange, yVisibleRange, remainingItems);
            visibleItemsCount += seriesVisibleItems;
            if (visibleItemsCount >= minVisibleItems) return true;
        }

        return boundSeries.size === 0;
    }

    private getMementoRanges() {
        const zoom = this.getDefinedZoom();
        let autoScaledAxes: AgAutoScaledAxes | undefined;
        if (this.autoScaleYAxis.enabled) {
            autoScaledAxes = this.autoScaleYAxis.manuallyAdjusted ? [] : ['y'];
        }
        const memento: RequireOptional<ZoomMemento> & {
            ratioX: Required<AgZoomRatio>;
            ratioY: Required<AgZoomRatio>;
        } = {
            rangeX: this.getRangeDirection(zoom.x, ChartAxisDirection.X),
            rangeY: this.getRangeDirection(zoom.y, ChartAxisDirection.Y),
            ratioX: { start: zoom.x.min, end: zoom.x.max },
            ratioY: { start: zoom.y.min, end: zoom.y.max },
            autoScaledAxes,
        };
        return memento;
    }

    private getAutoScaleYZoom(zoomX: ZoomState): ZoomState | undefined {
        if (!this.isZoomEnabled()) return;

        const { independentAxes, autoScaleYAxis } = this;

        if (!autoScaleYAxis.enabled || autoScaleYAxis.manuallyAdjusted) return;

        const { padding } = autoScaleYAxis;
        let yZoom: ZoomState | undefined;
        if (independentAxes) {
            yZoom = this.primaryAxisZoom(ChartAxisDirection.Y, zoomX, { padding });
        } else {
            yZoom = this.combinedAxisZoom(ChartAxisDirection.Y, zoomX, { padding });
        }

        if (zoomX.min === 0 && zoomX.max === 1) {
            // If autoScaling is not possible (i.e. horizontal bar series), do not autoscale when zoomed out
            return yZoom == null ? undefined : { min: 0, max: 1 };
        } else {
            return yZoom;
        }
    }

    private autoScaleYZoom(callerId: string, applyChanges = true) {
        const { independentAxes } = this;

        const zoom = this.getZoom();
        if (zoom?.x == null) return;

        const zoomY = this.getAutoScaleYZoom(zoom.x);
        if (zoomY == null || objectsEqual(zoom.y, zoomY)) return;

        if (independentAxes) {
            const primaryAxis = this.getPrimaryAxis(ChartAxisDirection.Y);
            const primaryAxisManager = primaryAxis == null ? undefined : this.axisZoomManagers.get(primaryAxis.id);
            primaryAxisManager?.updateZoom('zoom-manager', zoomY);
        } else {
            for (const axisZoomManager of this.axisZoomManagers.values()) {
                if (axisZoomManager.direction === ChartAxisDirection.Y) {
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

        this.eventsHub.emit('zoom:change', { ...this.getZoom(), axes, callerId });
        this.eventsHub.on('layout:complete', this.boundFireOnceChartEvent);
    }

    private readonly boundFireOnceChartEvent = this.fireOnceChartEvent.bind(this);
    private fireOnceChartEvent() {
        this.fireChartEvent<AgZoomEvent>({ type: 'zoom', ...this.getMementoRanges() });
        this.eventsHub.off('layout:complete', this.boundFireOnceChartEvent);
    }

    private getRangeDirection(ratio: ZoomState, direction: ChartAxisDirection): AgZoomRange | undefined {
        const axis = this.getPrimaryAxis(direction);
        if (!axis || (!ContinuousScale.is(axis.scale) && !DiscreteTimeScale.is(axis.scale))) return;

        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        const [d0, d1] = extents;

        let start;
        let end;

        if (d0 <= d1) {
            start = axis.scale.invert(0); // 0 is the start of the visible axis
            end = axis.scale.invert(d0 + (d1 - d0) * ratio.max);
        } else {
            start = axis.scale.invert(d0 - (d0 - d1) * ratio.min);
            end = axis.scale.invert(0);
        }

        return { start, end };
    }

    private rangeToRatio(range: AgZoomRange, direction: ChartAxisDirection): ZoomState | undefined {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return;

        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        const [d0, d1] = extents;

        const { scale } = axis;

        const { start, end } = range;

        const [startAlignment = ScaleAlignment.Leading, endAlignment = ScaleAlignment.Trailing] = rangeAlignment(
            start,
            end
        );
        let r0 = start == null ? d0 : scale.convert(start, { alignment: startAlignment });
        let r1 = end == null ? d1 : scale.convert(end, { alignment: endAlignment }) + (scale.bandwidth ?? 0);

        if (!isFiniteNumber(r0) || !isFiniteNumber(r1)) return;

        const [dMin, dMax] = [Math.min(d0, d1), Math.max(d0, d1)];

        if (r0 < dMin || r0 > dMax) {
            Logger.warnOnce(
                `Invalid range start [${start}], expecting a value between [${scale.invert(d0)}] and [${scale.invert(d1)}], ignoring.`
            );
            return;
        }

        if (r1 < dMin || r1 > dMax) {
            Logger.warnOnce(
                `Invalid range end [${end}], expecting a value between [${scale.invert(d0)}] and [${scale.invert(d1)}], ignoring.`
            );
            return;
        }

        r0 = Math.min(dMax, Math.max(dMin, r0));
        r1 = Math.min(dMax, Math.max(dMin, r1));

        const diff = d1 - d0;
        if (diff === 0) return;

        const min = Math.abs((r0 - d0) / diff);
        const max = Math.abs((r1 - d0) / diff);
        if (min >= max) return;

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
        const [d0, d1] = axis.scale.range;

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
            if (!series.visible) continue;

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
    public readonly direction: CartesianAxisDirection;
    private currentZoom: ZoomState;
    private readonly state: StateTracker<ZoomState>;

    constructor(axis: CartesianAxisDirection | ChartAxisLike) {
        let min: number;
        let max: number;
        if (typeof axis === 'string') {
            this.direction = axis;
            min = 0;
            max = 1;
        } else {
            this.direction = axis.direction as CartesianAxisDirection;
            [min = 0, max = 1] = axis.visibleRange;
        }

        this.state = new StateTracker({ min, max });
        this.currentZoom = this.state.stateValue()!;
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
