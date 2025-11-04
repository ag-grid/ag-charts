import {
    type AxisID,
    type BoxBounds,
    type DeepReadonly,
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

import type {
    AxisZoomState,
    EventsHub,
    ZoomChangeRequestedEvent,
    ZoomChangeType,
    ZoomState,
} from '../../core/eventsHub';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { BBox } from '../../scene/bbox';
import { BaseManager } from '../../util/baseManager';
import { deepClone } from '../../util/json';
import { objectsEqual, strictObjectKeys } from '../../util/object';
import type { TypedEvent } from '../../util/observable';
import { calcPanToBBoxRatios } from '../../util/panToBBox';
import { NonNullableStateTracker } from '../../util/stateTracker';
import { type CartesianAxisDirection, ChartAxisDirection } from '../chartAxisDirection';
import { rangeAlignment } from '../rangeAlignment';
import type { ISeries } from '../series/seriesTypes';

export interface DefinedZoomState {
    x: ZoomState;
    y: ZoomState;
}

type CoreZoomEntry = ZoomState & { direction: CartesianAxisDirection };
export type CoreZoomState = Record<AxisID, CoreZoomEntry>;
export type CoreZoomStateSafeRetrieval = { readonly [K in AxisID]: CoreZoomEntry | undefined };

export type ZoomMemento = {
    rangeX?: AgZoomRange;
    rangeY?: AgZoomRange;
    ratioX?: AgZoomRatio;
    ratioY?: AgZoomRatio;
    autoScaledAxes?: AgAutoScaledAxes;
};

export type SimpleAxis = {
    id: AxisID;
    direction: CartesianAxisDirection;
};

export type CartesianAxisLike = SimpleAxis & {
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
    lastAutoScaleYAxis = true;
}

const rangeValidator = (axis?: CartesianAxisLike) =>
    attachDescription((value, { options }) => {
        if (!ContinuousScale.is(axis?.scale) && !DiscreteTimeScale.is(axis?.scale)) return true;
        if (value == null || options.end == null) return true;
        return value < options.end;
    }, `to be less than end`);

function validateChanges(changes: UpdateZoomParams['changes']): void {
    for (const axisId of strictObjectKeys(changes)) {
        const zoom = changes[axisId];
        if (!zoom) continue;

        const { min, max } = zoom;

        if (min < 0 || max > 1) {
            Logger.warnOnce(
                `Attempted to update axis (${axisId}) zoom to an invalid ratio of [{ min: ${min}, max: ${max} }], expecting a ratio of 0 to 1. Ignoring.`
            );

            // Remove invalid zoom state for this axis
            delete changes[axisId];
        }
    }
}

type UpdateZoomParams = {
    callerId: string;
    changes: Record<AxisID, ZoomState>;
    changeType: ZoomChangeType;
};

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager {
    public mementoOriginatorKey = 'zoom' as const;

    private readonly state = new NonNullableStateTracker<CoreZoomStateSafeRetrieval>({}, 'initial');
    private readonly axes: CartesianAxisLike[] = [];
    private didLayoutAxes = false;

    private readonly autoScaleYAxis = new ZoomManagerAutoScaleAxis();
    private lastRestoredState: CoreZoomStateSafeRetrieval | undefined = undefined;
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
            eventsHub.on('zoom:change-complete', () => {
                this.fireChartEvent<AgZoomEvent>({ type: 'zoom', ...this.getMementoRanges() });
            }),
            eventsHub.on('layout:complete', () => {
                this.didLayoutAxes = true;

                const { pendingMemento } = this;
                if (pendingMemento) {
                    this.restoreMemento(pendingMemento.version, pendingMemento.mementoVersion, pendingMemento.memento);
                }

                this.autoScaleYZoom('zoom-manager', 'layoutComplete');
            })
        );
    }

    private toCoreZoomState(axisZoom: DeepReadonly<AxisZoomState>): CoreZoomState {
        const result: CoreZoomState = {};
        let ids: AxisID[];
        const state = this.state.stateValue();

        if (this.independentAxes) {
            const xId = this.getPrimaryAxisId(ChartAxisDirection.X);
            const yId = this.getPrimaryAxisId(ChartAxisDirection.Y);
            ids = [];
            if (xId) ids.push(xId);
            if (yId) ids.push(yId);
        } else {
            ids = strictObjectKeys(state);
        }

        for (const id of ids) {
            const { direction } = state[id] ?? {};
            if (direction != undefined) {
                const zoom = axisZoom[direction];
                if (zoom) {
                    const { min, max } = zoom;
                    result[id] = { min, max, direction };
                }
            }
        }

        return result;
    }

    private toAxisZoomState(coreZoom: DeepReadonly<CoreZoomStateSafeRetrieval>): AxisZoomState | undefined {
        let x: ZoomState | undefined;
        let y: ZoomState | undefined;

        // Use the zoom on the primary (first) axis in each direction
        for (const id of strictObjectKeys(coreZoom)) {
            const { min, max, direction } = coreZoom[id]!;
            if (direction === ChartAxisDirection.X) {
                x ??= { min, max };
            } else if (direction === ChartAxisDirection.Y) {
                y ??= { min, max };
            }
        }

        if (x || y) {
            return { x, y };
        }
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
        if (!this.axes || !this.didLayoutAxes) {
            this.pendingMemento = { version, mementoVersion, memento };
            return;
        }
        this.pendingMemento = undefined;

        // Migration from older versions can be implemented here.

        const zoom: DefinedZoomState & Pick<AxisZoomState, 'autoScaleYAxis'> = this.getDefinedZoom();

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

        const changes = this.toCoreZoomState(zoom);
        this.lastRestoredState = changes;
        this.autoScaleYAxis.lastAutoScaleYAxis = zoom.autoScaleYAxis ?? false;
        this.applyUpdateZoom({ callerId: 'zoom-manager', changeType: 'restoreMemento', changes });
    }

    public setAxes(nextAxes: Array<CartesianAxisLike> | Array<SimpleAxis>) {
        const { axes } = this;
        axes.length = 0;
        for (const axis of nextAxes) {
            if ('range' in axis) {
                axes.push(axis);
            }
        }

        const callerId = this.state.stateId();
        const oldState = this.state.stateValue();
        const changes: CoreZoomState = {};
        for (const { id, direction } of nextAxes) {
            const { min, max } = oldState[id] ?? { min: 0, max: 1 };
            changes[id] = { min, max, direction };
        }
        this.state.set(callerId, changes);
        this.applyUpdateZoom({ callerId, changeType: 'setAxes', changes });
    }

    public setIndependentAxes(independent = true) {
        this.independentAxes = independent;
    }

    public setAutoScaleYAxis(enabled: boolean, padding: number) {
        this.autoScaleYAxis.enabled = enabled;
        this.autoScaleYAxis.padding = padding;

        if (enabled) {
            this.autoScaleYZoom('toggle-auto-scale', 'update');
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
        this.updateChanges(callerId, this.toCoreZoomState(newZoom ?? {}));
    }

    public updateAxisZoom(callerId: string, axisId: AxisID, newZoom?: ZoomState) {
        const changes = { [axisId]: newZoom ?? this.getAxisZoom(axisId) };
        this.updateChanges(callerId, changes);
    }

    public updateChanges(callerId: string, changes: UpdateZoomParams['changes']) {
        this.applyUpdateZoom({ callerId, changeType: 'update', changes });
    }

    private computeChangedAxesIds(newState: UpdateZoomParams['changes']): readonly AxisID[] {
        const result: AxisID[] = [];
        const oldState = this.state.stateValue();
        for (const id of strictObjectKeys(newState)) {
            const newAxisState = newState[id];
            const oldAxisState = oldState[id];
            if (
                oldAxisState == undefined ||
                oldAxisState.min !== newAxisState.min ||
                oldAxisState.max !== newAxisState.max
            ) {
                result.push(id);
            }
        }
        return result;
    }

    private applyUpdateZoom(
        { callerId, changeType, changes }: UpdateZoomParams,
        autoScaleYAxis?: boolean // TODO(olegat) move to enterprise
    ) {
        validateChanges(changes);

        autoScaleYAxis ??= this.autoScaleYAxis.enabled && !this.autoScaleYAxis.manuallyAdjusted;

        const changedAxes = this.computeChangedAxesIds(changes);
        const newState: CoreZoomStateSafeRetrieval = deepClone(this.state.stateValue());
        for (const id of changedAxes) {
            const axis = newState[id];
            if (axis != undefined) {
                axis.min = changes[id].min;
                axis.max = changes[id].max;
            }
        }
        this.state.set(callerId, newState);

        if (autoScaleYAxis != null) {
            this.autoScaleYAxis.manuallyAdjusted = !autoScaleYAxis;
        }

        this.dispatch(callerId, changeType, changedAxes);
    }

    public resetZoom(callerId: string) {
        this.autoScaleYAxis.manuallyAdjusted = false;

        const { lastAutoScaleYAxis } = this.autoScaleYAxis;
        const changes = this.toCoreZoomState(this.getRestoredZoom());
        this.applyUpdateZoom({ callerId, changeType: 'reset', changes }, lastAutoScaleYAxis);
    }

    public resetAxisZoom(callerId: string, axisId: AxisID) {
        const direction = this.state.stateValue()[axisId]?.direction;
        if (direction == null) return;
        const restoredZoom = this.getRestoredZoom();
        let lastAutoScaleYAxis: boolean | undefined;
        if (direction === ChartAxisDirection.Y) {
            lastAutoScaleYAxis = restoredZoom?.autoScaleYAxis ?? true;
            this.autoScaleYAxis.manuallyAdjusted = !lastAutoScaleYAxis;
        }
        const changes = this.toCoreZoomState({ [direction]: restoredZoom[direction] });
        this.applyUpdateZoom({ callerId, changeType: 'reset', changes });
    }

    public setAxisManuallyAdjusted(_callerId: string, axisId: AxisID) {
        const direction = this.state.stateValue()[axisId]?.direction;
        if (direction !== ChartAxisDirection.Y) return;
        this.autoScaleYAxis.manuallyAdjusted = true;
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
        const changes = this.toCoreZoomState(newZoom);
        this.applyUpdateZoom({ callerId, changeType: 'panToBBox', changes });
        return true;
    }

    // Fire this event to signal to listeners that the view is changing through a zoom and/or pan change.
    public fireZoomPanStartEvent(callerId: string) {
        this.eventsHub.emit('zoom:pan-start', { callerId });
    }

    public extendToEnd(callerId: string, direction: CartesianAxisDirection, extent: number) {
        return this.extendWith(callerId, direction, (end) => Number(end) - extent);
    }

    public extendWith(callerId: string, direction: CartesianAxisDirection, fn: (end: Date | number) => Date | number) {
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
        direction: CartesianAxisDirection,
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
        return this.toAxisZoomState(this.state.stateValue());
    }

    public getAxisZoom(axisId: AxisID): ZoomState {
        return this.state.stateValue()[axisId] ?? { min: 0, max: 1 };
    }

    public getAxisZooms(): CoreZoomStateSafeRetrieval {
        return this.state.stateValue();
    }

    public getRestoredZoom() {
        // TODO: Move `zoomUtils.ts` to community and use `definedZoomState()` here.
        const zoom = this.toAxisZoomState(this.lastRestoredState ?? {});
        const newZoom = {
            x: { min: zoom?.x?.min ?? 0, max: zoom?.x?.max ?? 1 },
            y: { min: zoom?.y?.min ?? 0, max: zoom?.y?.max ?? 1 },
            autoScaleYAxis: zoom?.autoScaleYAxis ?? true,
        };
        return newZoom;
    }

    public getPrimaryAxisId(direction: CartesianAxisDirection) {
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

    private autoScaleYZoom(callerId: string, changeType: ZoomChangeType | undefined, apply = true) {
        const zoom = this.getZoom();
        if (zoom?.x == null) return;

        const zoomY = this.getAutoScaleYZoom(zoom.x);
        if (zoomY == null || objectsEqual(zoom.y, zoomY)) return;

        if (changeType && apply) {
            const changes = this.toCoreZoomState({ y: zoomY });
            this.applyUpdateZoom({ callerId, changeType, changes });
        }
    }

    private dispatch(callerId: string, changeType: ZoomChangeType, changedAxes: readonly AxisID[]) {
        this.autoScaleYZoom(callerId, undefined, false);

        if (changedAxes.length === 0) {
            return;
        }

        const { x, y } = this.getZoom() ?? {};
        const state = this.state.stateValue();
        const newEvent: ZoomChangeRequestedEvent = { callerId, changeType, changedAxes, state, x, y };
        this.eventsHub.emit('zoom:change-request', newEvent);
    }

    private getRangeDirection(ratio: ZoomState, direction: CartesianAxisDirection): AgZoomRange | undefined {
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

    private rangeToRatio(range: AgZoomRange, direction: CartesianAxisDirection): ZoomState | undefined {
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

    private getPrimaryAxis(direction: CartesianAxisDirection) {
        return this.axes?.find((a) => a.direction === direction);
    }

    private getDomainExtents(axis: CartesianAxisLike) {
        const { domain } = axis.scale;
        const d0 = domain.at(0);
        const d1 = domain.at(-1);

        if (d0 == null || d1 == null) return;

        return [d0, d1];
    }

    private getDomainPixelExtents(axis: CartesianAxisLike) {
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
        xAxis: CartesianAxisLike,
        yAxis: CartesianAxisLike,
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
        direction: CartesianAxisDirection,
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
        direction: CartesianAxisDirection,
        zoom: ZoomState,
        { padding = 0 } = {}
    ): ZoomState | undefined {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const seriesXAxes = new Map<any, CartesianAxisLike>();
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
