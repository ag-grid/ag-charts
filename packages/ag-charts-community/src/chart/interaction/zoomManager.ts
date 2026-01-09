import {
    ChartAxisDirection,
    Logger,
    ScaleAlignment,
    attachDescription,
    deepClone,
    deepFreeze,
    defined,
    definedZoomState,
    isFiniteNumber,
    isObject,
    jsonDiff,
    strictObjectKeys,
    validate,
} from 'ag-charts-core';
import type {
    AxisID,
    BoxBounds,
    CartesianAxisDirection,
    DeepReadonly,
    DefinedZoomState,
    OptionsDefs,
    RequireOptional,
    Scale,
    ZoomMinMax,
    ZoomState,
} from 'ag-charts-core';
import type { AgZoomEvent, AgZoomEventSource, AgZoomRange, AgZoomRatio } from 'ag-charts-types';

import type {
    EventsHub,
    ZoomChangeRequestEvent,
    ZoomChangeState,
    ZoomEventSourceDetail,
    ZoomMemento,
} from '../../core/eventsHub';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { BBox } from '../../scene/bbox';
import { BaseManager } from '../../util/baseManager';
import type { TypedEvent } from '../../util/observable';
import { calcPanToBBoxRatios } from '../../util/panToBBox';
import { rangeAlignment } from '../rangeAlignment';
import type { ISeries } from '../series/seriesTypes';
import type { UpdateService } from '../updateService';

type CoreZoomEntry = ZoomMinMax & { direction: CartesianAxisDirection };
export type CoreZoomState = Record<AxisID, CoreZoomEntry>;
export type CoreZoomStateSafeRetrieval = { readonly [K in AxisID]: CoreZoomEntry | undefined };

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

const rangeValidator = (axis?: CartesianAxisLike) =>
    attachDescription((value, { options }) => {
        if (!ContinuousScale.is(axis?.scale) && !DiscreteTimeScale.is(axis?.scale)) return true;
        if (value == null || options.end == null) return true;
        return value < options.end;
    }, `to be less than end`);

function validateChanges(changes: UpdateZoomChanges): void {
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

export type UpdateZoomSourcing = {
    source: AgZoomEventSource;
    sourceDetail: ZoomEventSourceDetail;
};
export type UpdateZoomChanges = Record<AxisID, ZoomMinMax | undefined>;
export type UpdateZoomParams = UpdateZoomSourcing & {
    isReset: boolean;
    changes: UpdateZoomChanges;
};

function refreshCoreState(nextAxes: Array<CartesianAxisLike> | Array<SimpleAxis>, state: CoreZoomStateSafeRetrieval) {
    const result: CoreZoomState = {};
    for (const { id, direction } of nextAxes) {
        const { min, max } = state[id] ?? { min: 0, max: 1 };
        result[id] = { min, max, direction };
    }
    return result;
}

function areEqualCoreZooms(p: CoreZoomStateSafeRetrieval, q: CoreZoomStateSafeRetrieval) {
    const pKeys = strictObjectKeys(p);
    const qKeys = strictObjectKeys(q);

    // Check that pKeys & qKeys are the same set of strings:
    if (pKeys.length !== qKeys.length) return false;
    for (const k of pKeys) if (!qKeys.includes(k)) return false;

    for (const k of pKeys) {
        const pVal = p[k];
        const qVal = q[k];
        if (pVal === qVal) {
            continue;
        } else if (
            pVal == undefined ||
            qVal == undefined ||
            pVal.direction !== qVal.direction ||
            pVal.min !== qVal.min ||
            pVal.max !== qVal.max
        ) {
            return false;
        }
    }
    return true;
}

export function userInteraction<D extends ZoomEventSourceDetail>(sourceDetail: D) {
    return { source: 'user-interaction' as const, sourceDetail };
}

type StrictZoomMemento = RequireOptional<ZoomMemento> & {
    ratioX: Required<AgZoomRatio>;
    ratioY: Required<AgZoomRatio>;
};

class APIZoomEventDispatcher {
    private pendingSource: AgZoomEventSource | undefined;
    private lastDispatchedMemento: StrictZoomMemento = {
        autoScaledAxes: undefined,
        rangeX: { end: undefined, start: undefined },
        rangeY: { end: undefined, start: undefined },
        ratioX: { end: Number.NaN, start: Number.NaN },
        ratioY: { end: Number.NaN, start: Number.NaN },
    };

    schedule(source: AgZoomEventSource): void {
        this.pendingSource = source;
    }

    nextEvent(memento: StrictZoomMemento): AgZoomEvent | undefined {
        const { pendingSource: source } = this;
        // AG-16317 Use `jsonDiff` to only dispatch the event if there's been a change:
        if (source != undefined && jsonDiff(memento, this.lastDispatchedMemento) != null) {
            this.pendingSource = undefined;
            this.lastDispatchedMemento = memento;
            return { type: 'zoom', source, ...memento };
        }
    }
}

/**
 * Manages the current zoom state for a chart. Tracks the requested zoom from distinct dependents
 * and handles conflicting zoom requests.
 */
export class ZoomManager extends BaseManager {
    public mementoOriginatorKey = 'zoom' as const;

    private state: CoreZoomStateSafeRetrieval = {};
    private readonly axes: CartesianAxisLike[] = [];
    private didLayoutAxes = false;
    private readonly apiZoomEventDispatcher = new APIZoomEventDispatcher();

    private lastRestoredState: CoreZoomStateSafeRetrieval = {};
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
        updateService: UpdateService,
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

                // Maybe fire 'zoom:change-request' if the zoom-state has changed in this redraw:
                this.updateZoom({
                    source: 'chart-update', // FIXME(AG-16412): this is "probably" what caused, but we don't really know
                    sourceDetail: 'unspecified',
                });
            }),
            updateService.addListener('update-complete', ({ wasShortcut }) => {
                if (wasShortcut) return;
                const event = this.apiZoomEventDispatcher.nextEvent(this.getMementoRanges());
                if (event) {
                    this.fireChartEvent(event);
                }
            })
        );
    }

    // FIXME: should be private
    public toCoreZoomState(axisZoom: DeepReadonly<ZoomState>): CoreZoomState {
        const result: CoreZoomState = {};
        let ids: AxisID[];
        const { state } = this;

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

    // FIXME: should be private
    public toZoomState(coreZoom: DeepReadonly<CoreZoomStateSafeRetrieval>): ZoomState | undefined {
        let x: ZoomMinMax | undefined;
        let y: ZoomMinMax | undefined;

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

    public createMemento(): ZoomMemento {
        return this.getMementoRanges();
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

        const zoom = definedZoomState(this.getZoom());
        if (memento?.rangeX) {
            zoom.x = this.rangeToRatioDirection(ChartAxisDirection.X, memento.rangeX) ?? { min: 0, max: 1 };
        } else if (memento?.ratioX) {
            zoom.x = {
                min: memento.ratioX.start ?? 0,
                max: memento.ratioX.end ?? 1,
            };
        } else {
            zoom.x = { min: 0, max: 1 };
        }
        const { navigatorModule, zoomModule } = this;
        this.eventsHub.emit('zoom:load-memento', { zoom, memento, navigatorModule, zoomModule });

        const changes = this.toCoreZoomState(zoom);
        this.lastRestoredState = deepFreeze(deepClone(changes));
        this.updateChanges({
            source: 'state-change',
            sourceDetail: 'internal-restoreMemento',
            changes,
            isReset: false,
        });
    }

    private findAxis(axisId: AxisID): CartesianAxisLike | undefined {
        for (const a of this.axes) {
            if (a.id === axisId) return a;
        }
    }

    public getAxes() {
        return this.axes;
    }

    public setAxes(nextAxes: Parameters<typeof refreshCoreState>[0]) {
        const { axes } = this;
        axes.length = 0;
        for (const axis of nextAxes) {
            if ('range' in axis) {
                axes.push(axis);
            }
        }

        const oldState = this.state;
        const changes = refreshCoreState(nextAxes, oldState);
        this.state = changes;
        this.lastRestoredState = refreshCoreState(nextAxes, this.lastRestoredState);

        this.updateChanges({ source: 'chart-update', sourceDetail: 'internal-setAxes', changes, isReset: false });
    }

    public setIndependentAxes(independent = true) {
        this.independentAxes = independent;
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

    public updateZoom({ source, sourceDetail }: UpdateZoomSourcing, newZoom?: ZoomState): boolean {
        const changes = this.toCoreZoomState(newZoom ?? {});
        return this.updateChanges({ source, sourceDetail, changes, isReset: false });
    }

    private computeChangedAxesIds(newState: UpdateZoomChanges): readonly AxisID[] {
        const result: AxisID[] = [];
        const oldState = this.state;
        for (const id of strictObjectKeys(newState)) {
            const newAxisState = newState[id] ?? { min: 0, max: 1 };
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

    public updateChanges(params: UpdateZoomParams): boolean {
        const { source, sourceDetail, isReset, changes } = params;
        validateChanges(changes);

        const changedAxes = this.computeChangedAxesIds(changes);
        const newState: CoreZoomStateSafeRetrieval = deepClone(this.state);
        for (const id of changedAxes) {
            const axis = newState[id];
            if (axis != undefined) {
                axis.min = changes[id]?.min ?? 0;
                axis.max = changes[id]?.max ?? 1;
            }
        }
        this.state = newState;

        return this.dispatch(source, sourceDetail, changedAxes, isReset);
    }

    public resetZoom({ source, sourceDetail }: UpdateZoomSourcing) {
        this.updateChanges({ source, sourceDetail, changes: this.getRestoredZoom(), isReset: true });
    }

    public resetAxisZoom({ source, sourceDetail }: UpdateZoomSourcing, axisId: AxisID) {
        this.updateChanges({
            source,
            sourceDetail,
            changes: { [axisId]: this.getRestoredZoom()[axisId] },
            isReset: true,
        });
    }

    public panToBBox(seriesRect: BBox, target: BoxBounds): boolean {
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

        const newZoom: ZoomState = calcPanToBBoxRatios(seriesRect, zoom, target);
        const changes = this.toCoreZoomState(newZoom);
        return this.updateChanges({
            source: 'user-interaction',
            sourceDetail: 'internal-panToBBox',
            changes,
            isReset: false,
        });
    }

    // Fire this event to signal to listeners that the view is changing through a zoom and/or pan change.
    public fireZoomPanStartEvent(callerId: 'navigator' | 'zoom') {
        this.eventsHub.emit('zoom:pan-start', { callerId });
    }

    public extendToEnd(sourcing: UpdateZoomSourcing, direction: CartesianAxisDirection, extent: number) {
        return this.extendWith(sourcing, direction, (end) => Number(end) - extent);
    }

    public extendWith(
        { source, sourceDetail }: UpdateZoomSourcing,
        direction: CartesianAxisDirection,
        fn: (end: Date | number) => Date | number
    ) {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return;

        const extents = this.getDomainExtents(axis);
        if (!extents) return;

        const [, end] = extents;
        const start = fn(end);

        const ratio = this.rangeToRatioAxis(axis, { start });
        if (!ratio) return;

        this.updateChanges({ source, sourceDetail, changes: { [direction]: ratio }, isReset: false });
    }

    public updateWith(
        { source, sourceDetail }: UpdateZoomSourcing,
        direction: CartesianAxisDirection,
        fn: (start: Date | number, end: Date | number) => [Date | number, Date | number]
    ) {
        const axis = this.getPrimaryAxis(direction);
        if (!axis) return;

        const extents = this.getDomainExtents(axis);
        if (!extents) return;

        let [start, end] = extents;
        [start, end] = fn(start, end);

        const ratio = this.rangeToRatioAxis(axis, { start, end });
        if (!ratio) return;

        this.updateChanges({ source, sourceDetail, changes: { [direction]: ratio }, isReset: false });
    }

    public getZoom(): ZoomState | undefined {
        return this.toZoomState(this.state);
    }

    public getAxisZoom(axisId: AxisID): ZoomMinMax {
        return this.state[axisId] ?? { min: 0, max: 1 };
    }

    public getAxisZooms(): CoreZoomStateSafeRetrieval {
        return this.state;
    }

    public getCoreZoom(): CoreZoomStateSafeRetrieval {
        return this.state;
    }

    public getRestoredZoom(): CoreZoomStateSafeRetrieval {
        return this.lastRestoredState;
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

    public constrainZoomToItemCount(
        zoom: DefinedZoomState,
        minVisibleItems: number,
        shouldAutoscale: boolean
    ): DefinedZoomState {
        let xVisibleRange: [number, number] = [zoom.x.min, zoom.x.max];
        let yVisibleRange: [number, number] | undefined = shouldAutoscale ? undefined : [zoom.y.min, zoom.y.max];
        for (const series of this.getBoundSeries()) {
            const nextZoom = series.getZoomRangeFittingItems(xVisibleRange, yVisibleRange, minVisibleItems);
            if (nextZoom == null) continue;

            xVisibleRange = nextZoom.x;
            yVisibleRange = nextZoom.y;
        }

        const x = { min: xVisibleRange[0], max: xVisibleRange[1] };
        const y = yVisibleRange ? { min: yVisibleRange[0], max: yVisibleRange[1] } : undefined;
        return definedZoomState({ x, y });
    }

    public isVisibleItemsCountAtLeast(
        zoom: DefinedZoomState,
        minVisibleItems: number,
        opts: { autoScaleYAxis: boolean; includeYVisibleRange: boolean }
    ): boolean {
        const boundSeries = this.getBoundSeries();

        // Note: `series.getVisibleItems` has much better performance when `autoScaling.enabled: true`, because it only
        // needs to consider the X axis to count the number of visible items.
        const xVisibleRange: [number, number] = [zoom.x.min, zoom.x.max];
        const yVisibleRange: [number, number] | undefined =
            !opts.includeYVisibleRange && opts.autoScaleYAxis ? undefined : [zoom.y.min, zoom.y.max];

        let visibleItemsCount = 0;

        for (const series of boundSeries) {
            const remainingItems = minVisibleItems - (visibleItemsCount ?? 0);
            const seriesVisibleItems = series.getVisibleItems(xVisibleRange, yVisibleRange, remainingItems);
            visibleItemsCount += seriesVisibleItems;
            if (visibleItemsCount >= minVisibleItems) return true;
        }

        return boundSeries.size === 0;
    }

    private getMementoRanges(): StrictZoomMemento {
        const zoom = definedZoomState(this.getZoom());
        const memento: StrictZoomMemento = {
            rangeX: this.getRangeDirection(ChartAxisDirection.X, zoom.x),
            rangeY: this.getRangeDirection(ChartAxisDirection.Y, zoom.y),
            ratioX: { start: zoom.x.min, end: zoom.x.max },
            ratioY: { start: zoom.y.min, end: zoom.y.max },
            autoScaledAxes: undefined,
        };

        this.eventsHub.emit('zoom:save-memento', { memento });
        return memento;
    }

    private dispatch(
        source: AgZoomEventSource,
        sourceDetail: ZoomEventSourceDetail,
        changedAxes: readonly AxisID[],
        isReset: boolean
    ): boolean {
        const { x, y } = this.getZoom() ?? {};
        const state = this.state;
        let constrainedState: typeof state | undefined;

        const zoomManager = this;
        const event = {
            source,
            sourceDetail,
            isReset,
            changedAxes,
            state,
            x,
            y,
            stateAsDefinedZoom(): DefinedZoomState {
                return definedZoomState(zoomManager.toZoomState(event.state));
            },
            constrainZoom(restrictions: ZoomState): void {
                this.constrainChanges(zoomManager.toCoreZoomState(restrictions));
            },
            constrainChanges(restrictions: ZoomChangeState): void {
                constrainedState ??= deepClone(state);
                for (const id of strictObjectKeys(restrictions)) {
                    const src = restrictions[id];
                    const dst = constrainedState[id];
                    if (src && dst) {
                        dst.min = src.min;
                        dst.max = src.max;
                    }
                }
                event.state = constrainedState;
            },
        } satisfies ZoomChangeRequestEvent;

        this.eventsHub.emit('zoom:change-request', event);

        let wasChangeConstrained: boolean;
        if (constrainedState && !areEqualCoreZooms(state, constrainedState)) {
            wasChangeConstrained = true;
            this.state = constrainedState;
        } else {
            wasChangeConstrained = false;
        }

        const changeAccepted: boolean = changedAxes.length > 0 || wasChangeConstrained;
        if (changeAccepted) {
            const acceptedZoom = this.getZoom() ?? {};
            this.eventsHub.emit('zoom:change-complete', { source, sourceDetail, x: acceptedZoom.x });
        }
        this.apiZoomEventDispatcher.schedule(source); // (maybe) emit API AgZoomEvent when the redraw completes
        return changeAccepted;
    }

    public getRange(axisId: AxisID, ratio: ZoomMinMax): AgZoomRange | undefined {
        return this.getRangeAxis(this.findAxis(axisId), ratio);
    }

    private getRangeDirection(direction: CartesianAxisDirection, ratio: ZoomMinMax): AgZoomRange | undefined {
        return this.getRangeAxis(this.getPrimaryAxis(direction), ratio);
    }

    private getRangeAxis(axis: CartesianAxisLike | undefined, ratio: ZoomMinMax | undefined): AgZoomRange | undefined {
        if (!axis || !ratio || (!ContinuousScale.is(axis.scale) && !DiscreteTimeScale.is(axis.scale))) return;

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

    public rangeToRatio(axisId: AxisID, range: AgZoomRange): ZoomMinMax | undefined {
        return this.rangeToRatioAxis(this.findAxis(axisId), range);
    }

    public rangeToRatioDirection(direction: CartesianAxisDirection, range: AgZoomRange): ZoomMinMax | undefined {
        return this.rangeToRatioAxis(this.getPrimaryAxis(direction), range);
    }

    private rangeToRatioAxis(axis: CartesianAxisLike | undefined, range: AgZoomRange): ZoomMinMax | undefined {
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
        const r0 = start == null ? d0 : scale.convert(start, { alignment: startAlignment });
        const r1 = end == null ? d1 : scale.convert(end, { alignment: endAlignment }) + (scale.bandwidth ?? 0);

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

        const diff = d1 - d0;
        if (diff === 0) return;

        const min = Math.abs((r0 - d0) / diff);
        const max = Math.abs((r1 - d0) / diff);
        if (min >= max) return;

        return { min, max };
    }

    public getPrimaryAxis(direction: CartesianAxisDirection) {
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
}
